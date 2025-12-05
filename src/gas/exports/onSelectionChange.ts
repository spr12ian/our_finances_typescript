// onSelectionChange.ts
import type { SheetNameT } from "@domain";
import { getTriggerEventSheet } from "@gas/getTriggerEventSheet";
import { shouldHandleSelection } from "@gas/shouldHandleSelection";
import { getNamespaceKey } from "@lib/getNamespaceKey";
import { idempotencyKey } from "@lib/idempotency";
import { isSheetInIgnoreList } from "@lib/isSheetInIgnoreList";
import { FastLog, withLog } from "@lib/logging";
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { withGuardedLock } from "@lib/withGuardedLock";
import { queueJob } from "@queue/queueJob"; // or wherever this actually lives
import type { RunStepJob } from "src/features/workflow/workflowTypes";

export function onSelectionChange(e: any): void {
  const fn = onSelectionChange.name;

  const sheet = getTriggerEventSheet(e);
  if (!sheet) {
    FastLog.log(fn, "→ No sheet found");
    return;
  }

  const sheetName: SheetNameT = sheet.getName();
  if (isSheetInIgnoreList(sheetName, fn)) return;

  if (!shouldFixSheet(sheetName)) {
    FastLog.log(`onSelectionChange → Skipping sheet: ${sheetName}`);
    return;
  }

  if (!shouldHandleSelection(sheetName)) {
    FastLog.log(
      `onSelectionChange → Not handling selection for sheet: ${sheetName}`
    );
    return;
  }

  // ─────────────────────────────────────────────────────────
  // Idempotency: at most 1 “fix” job per sheet per N seconds
  // ─────────────────────────────────────────────────────────
  const workflowName = "fixSheetFlow";
  const stepName = "fixSheetStep1";
  const token = idempotencyKey(workflowName, stepName, sheetName);

  const key = getNamespaceKey("onSelectionChange", sheetName);

  withGuardedLock(
    {
      key,
      lockLabel: key,

      // idempotency: at most 1 fix per sheet every 5 minutes (tune as you like)
      idemToken: token,
      idemTtlSec: 5 * 60,
      idemScope: "document",
      // idemUseLock: false by default → no ScriptLock

      // per-user debounce: ignore super-fast repeats
      userDebounceMs: 2 * ONE_SECOND_MS,
      userDebounceMode: "per-key",

      // we already have debounce + idempotency; reentry is overkill here
      disableReentry: true,

      // we only enqueue a job; no need to lock the spreadsheet here
      disableLock: true,
    },
    () => {
      // IMPORTANT: keep this callback *very* light.
      // Only enqueue, don't run workflows synchronously.

      const runStepParameters = {
        workflowName,
        stepName,
        input: { sheetName, queuedBy: fn },
      } as RunStepJob;

      // Fire-and-forget: queue worker will pick this up.
      const job = withLog(queueJob)(runStepParameters, {
        // tweak priority if you have one
        priority: 5,
      });

      FastLog.log(
        "onSelectionChange",
        `Queued fixSheet job for ${sheetName} → row ${job.row}`
      );
    }
  );
}

function shouldFixSheet(name: SheetNameT): boolean {
  if (!name) return false;
  if (name.startsWith("_")) {
    FastLog.info(
      "onSelectionChange does not call fixSheet for account sheets. Use the menu for now!"
    );
    return false;
  }
  return true;
}
