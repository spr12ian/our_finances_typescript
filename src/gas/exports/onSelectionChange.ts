// onSelectionChange.ts
import { shouldHandleSelection } from "@gas/shouldHandleSelection";
import { getNamespaceKey } from "@lib/getNamespaceKey";
import { idempotencyKey } from "@lib/idempotency";
import { FastLog } from "@lib/logging";
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { withGuardedLock } from "@lib/withGuardedLock";
import { setupWorkflowsOnce } from "@workflow";
import { startWorkflow } from "@workflow/workflowEngine";

export function onSelectionChange(e: any): void {
  const sheet = e?.range?.getSheet?.() ?? SpreadsheetApp.getActiveSheet();
  if (!sheet) {
    FastLog.log("onSelectionChange → No sheet found");
    return;
  }

  const sheetName = sheet.getName();
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

  // --- idempotency ---
  const wf = "fixSheetFlow";
  const step = "fixSheetStep1";
  const token = idempotencyKey(wf, step, sheetName);

  const key = getNamespaceKey("onSelectionChange", sheetName);

  // If fired again within 1s, it will be skipped.
  withGuardedLock(
    {
      key,
      lockLabel: key,
      // idempotency (skip if same sheet/step claimed within TTL)
      idemToken: token,
      idemTtlSec: 30, // same as your previous tryClaimKey
      idemScope: "document", // keep consistent with your cache usage
      // per-user per-key debounce
      userDebounceMs: 2 * ONE_SECOND_MS, // tune to taste
      userDebounceMode: "per-key", // don’t block other keys/sheets

      reentryTtlMs: ONE_SECOND_MS, // cooldown between events - short anti-spam debounce
      reentryOptions: {
        releaseOnFinish: true,
        scope: "document",
        lockMs: 150, // hold the reentry lock for a short time
      },
      // per-sheet cooldown
      cooldownMs: 15 * ONE_SECOND_MS, // 15s per-sheet throttle
      // cooldownKey defaults to key; cooldownScope defaults to "document"
      cooldownOnError: false, // default — start cooldown even if it fails
      lockTimeoutMs: 200, // maximum wait time to get exclusive sheet access
    },
    () => {
      setupWorkflowsOnce();
      startWorkflow(wf, step, {
        sheetName,
        startedBy: "onSelectionChange",
      });
    }
  );
}

function shouldFixSheet(name: string): boolean {
  if (!name) return false;
  if (name.startsWith("_")) return false;
  if (name === "Status" || name === "Queue") return false;
  return true;
}
