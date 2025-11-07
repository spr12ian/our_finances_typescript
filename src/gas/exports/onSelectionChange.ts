// onSelectionChange.ts
import { shouldHandleSelection } from "@gas/shouldHandleSelection";
import { getNamespaceKey } from "@lib/getNamespaceKey";
import { idempotencyKey } from "@lib/idempotency";
import { isSheetInIgnoreList } from "@lib/isSheetInIgnoreList";
import { FastLog, withLog } from "@lib/logging";
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { withGuardedLock } from "@lib/withGuardedLock";
import { setupWorkflowsOnce } from "@workflow";
import { startWorkflow } from "@workflow/workflowEngine";

export function onSelectionChange(e: any): void {
  const fn = onSelectionChange.name;
  const sheet = e?.range?.getSheet?.() ?? SpreadsheetApp.getActiveSheet();
  if (!sheet) {
    FastLog.log(fn, "→ No sheet found");
    return;
  }

  const sheetName = sheet.getName();
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

  // --- idempotency ---
  const wf = "fixSheetFlow";
  const step = "fixSheetStep1";
  const token = idempotencyKey(wf, step, sheetName);

  const key = getNamespaceKey("onSelectionChange", sheetName);

  withGuardedLock(
    {
      key,
      lockLabel: key,

      // idempotency: at most 1 fix per sheet every 61s
      idemToken: token,
      idemTtlSec: 61,
      idemScope: "document",

      // per-user debounce: ignore super-fast repeats
      userDebounceMs: 2 * ONE_SECOND_MS,
      userDebounceMode: "per-key",

      // short anti-spam reentry guard
      reentryTtlMs: ONE_SECOND_MS,
      reentryOptions: {
        releaseOnFinish: true,
        scope: "document",
        lockMs: 150,
      },

      lockTimeoutMs: 200,
    },
    () => {
      const ready = withLog(
        "setupWorkflowsOnce",
        setupWorkflowsOnce
      )({
        lockTimeoutMs: 200, // fail fast in simple trigger
        allowRetryTrigger: false, // don't create ScriptApp triggers here
      });

      if (!ready) {
        FastLog.warn(
          "onSelectionChange: engine not ready, skipping fixSheetFlow"
        );
        return;
      }

      withLog("startWorkflow", startWorkflow)(wf, step, {
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
