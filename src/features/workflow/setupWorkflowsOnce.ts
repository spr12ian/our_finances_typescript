// @workflow/setupWorkflowsOnce.ts
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { FastLog, functionStart } from "@logging";
import type { QueueEnqueueOptions } from "@queue";
import type { EnqueueFn } from "./engineState";
import { isEngineConfigured, setEnqueue } from "./engineState";
import { setupWorkflows } from "./setupWorkflows";

/**
 * Your queue function — the one that writes to the Queue sheet.
 * It MUST satisfy EnqueueFn: (parameters, options?) => { id: string; row: number }
 * If it's defined elsewhere, import it instead.
 */
import { queueJob } from "@queue/queueJob";

const enqueueAdapter: EnqueueFn = (parameters, options) => {
  const res = queueJob(parameters, toQueueOptions(options));
  if (!res) {
    throw new Error("queueJob failed to enqueue (returned undefined)");
  }
  return res;
};

/**
 * Ensure the workflow engine is configured exactly once.
 * Returns true iff the engine is ready (enqueue is bound).
 */
export function setupWorkflowsOnce(): boolean {
  const fn = setupWorkflowsOnce.name;
  const finish = functionStart(fn);

  try {
    // Already configured globally?
    if (isEngineConfigured()) {
      return true;
    }

    // Acquire a short script lock to avoid concurrent initialisation
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(4 * ONE_SECOND_MS)) {
      FastLog.warn(
        `${fn}: not ready (configured=${isEngineConfigured()}) — scheduling retry`
      );
      scheduleRetry_();
      return false;
    }

    try {
      // Another instance might have configured while we waited
      if (!isEngineConfigured()) {
        // 🚩 The ONLY place we bind enqueue to the engine
        // ✅ Bind the ADAPTER here (not queueJob), under the lock
        setEnqueue(enqueueAdapter);

        // Register flows/steps etc. (safe to rerun)
        setupWorkflows();

        FastLog.log(`${fn}: engine configured`);
      }

      return true;
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    FastLog.error(fn, `failed: ${String(err)}`);
    return false; // let callers skip work
  } finally {
    finish();
  }
}

/** One-off retry helper (time-based trigger) */
function scheduleRetry_() {
  // Avoid piling up duplicates
  const existing = ScriptApp.getProjectTriggers().find(
    (t) =>
      t.getHandlerFunction && t.getHandlerFunction() === "_retrySetupWorkflows"
  );
  if (!existing) {
    try {
      ScriptApp.newTrigger("_retrySetupWorkflows")
        .timeBased()
        .after(5 * ONE_SECOND_MS)
        .create();
    } catch (err) {
      FastLog.error(
        "_retrySetupWorkflows",
        `retry trigger create failed: ${String(err)}`
      );
    }
  }
}

// If QueueEnqueueOptions ≠ EnqueueOptions, adapt options too:
function toQueueOptions(options?: { runAt?: Date | null; priority?: number }) {
  return {
    runAt: options?.runAt ?? undefined, // or convert to your sheet's expected format
    priority: options?.priority,
  } as QueueEnqueueOptions; // or an explicit QueueEnqueueOptions if you have the type
}

// Expose the retry target in global scope for Apps Script
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)._retrySetupWorkflows = function _retrySetupWorkflows() {
  try {
    const ok = setupWorkflowsOnce();
    if (ok) {
      // remove this one-off trigger
      const trig = ScriptApp.getProjectTriggers().find(
        (t) =>
          t.getHandlerFunction &&
          t.getHandlerFunction() === "_retrySetupWorkflows"
      );
      if (trig) ScriptApp.deleteTrigger(trig);
    } else {
      // try once more in 10s, then give up silently
      scheduleRetry_();
    }
  } catch {
    // swallow — next entry point will try again
  }
};
