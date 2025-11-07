// @workflow/setupWorkflowsOnce.ts
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { FastLog, functionStart } from "@logging";
import type { QueueEnqueueOptions } from "@queue";
import { queueJob } from "@queue/queueJob";
import type { EnqueueFn } from "./engineState";
import { isEngineConfigured, setEnqueue } from "./engineState";
import { setupWorkflows } from "./setupWorkflows";

const DEFAULT_LOCK_TIMEOUT_MS = 4 * ONE_SECOND_MS;

export interface SetupWorkflowsOptions {
  /** Max time to wait for the ScriptLock (ms). Default: 4s */
  lockTimeoutMs?: number;
  /** Whether to schedule a retry trigger if lock is busy. Default: true */
  allowRetryTrigger?: boolean;
}

const enqueueAdapter: EnqueueFn = (parameters, options) => {
  const res = queueJob(parameters, toQueueOptions(options));
  if (!res) {
    throw new Error(
      `queueJob failed to enqueue (returned undefined) for parameters=${JSON.stringify(
        parameters
      )}`
    );
  }

  return res;
};

let _ready = false;

/**
 * Ensure the workflow engine is configured exactly once.
 * Returns true iff the engine is ready (enqueue is bound).
 */
export function setupWorkflowsOnce(opts: SetupWorkflowsOptions = {}): boolean {
  const fn = setupWorkflowsOnce.name;
  const finish = functionStart(fn);

  const { lockTimeoutMs = DEFAULT_LOCK_TIMEOUT_MS, allowRetryTrigger = true } =
    opts;

  try {
    // Already configured globally?
    if (_ready && isEngineConfigured()) {
      FastLog.log(fn, "Already configured (fast path)");
      return true;
    }

    // Global engine state is configured but local flag isn't yet
    if (isEngineConfigured()) {
      _ready = true;
      FastLog.log(fn, "Already configured (engineState)");
      return true;
    }

    // Acquire a short script lock to avoid concurrent initialisation
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(lockTimeoutMs)) {
      FastLog.warn(
        fn,
        `Not ready (configured=${isEngineConfigured()}, localReady=${_ready}) — ` +
          (allowRetryTrigger ? "scheduling retry" : "skipping retry")
      );

      if (allowRetryTrigger) {
        scheduleRetry_();
      }
      return false;
    }

    try {
      // Another instance might have configured while we waited
      if (!isEngineConfigured()) {
        setEnqueue(enqueueAdapter);
        setupWorkflows();
        FastLog.log(fn, `Engine configured`);
      } else {
        FastLog.log(fn, `Engine already configured after acquiring lock`);
      }
      _ready = true;

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
function scheduleRetry_(delayMs: number = 5 * ONE_SECOND_MS) {
  const existing = ScriptApp.getProjectTriggers().find(
    (t) => t.getHandlerFunction() === "_retrySetupWorkflows"
  );
  if (existing) {
    FastLog.log(
      "scheduleRetry_",
      "Retry trigger already exists; not scheduling another"
    );
    return;
  }

  try {
    ScriptApp.newTrigger("_retrySetupWorkflows")
      .timeBased()
      .after(delayMs)
      .create();
  } catch (err) {
    FastLog.error(
      "scheduleRetry_",
      `retry trigger create failed: ${String(err)}`
    );
  }
}

function toQueueOptions(options?: { runAt?: Date | null; priority?: number }) {
  return {
    runAt: options?.runAt ?? undefined,
    priority: options?.priority,
  } as QueueEnqueueOptions;
}

// Expose the retry target in global scope for Apps Script
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)._retrySetupWorkflows = function _retrySetupWorkflows() {
  try {
    const ok = setupWorkflowsOnce({
      allowRetryTrigger: false, // important: retry handler owns retries
    });

    if (ok) {
      const trig = ScriptApp.getProjectTriggers().find(
        (t) =>
          t.getHandlerFunction &&
          t.getHandlerFunction() === "_retrySetupWorkflows"
      );
      if (trig) ScriptApp.deleteTrigger(trig);
    } else {
      // try once more in 10s, then give up silently
      scheduleRetry_(10 * ONE_SECOND_MS);
    }
  } catch {
    // swallow — next entry point will try again
  }
};
