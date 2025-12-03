// @workflow/setupWorkflowsOnce.ts

import { ONE_SECOND_MS } from "@lib/timeConstants";
import { FastLog, functionStart, withLog } from "@logging";
import type { QueueEnqueueOptions } from "@queue";
import { queueJob } from "@queue/queueJob";
import type { SerializedRunStepParameters } from "@workflow/workflowTypes";
import type { EnqueueFn, EnqueueOptions } from "./engineState";
import { isEngineConfigured, setEnqueue } from "./engineState";
import { registerAllWorkflows } from "./registerAllWorkflows";

const DEFAULT_LOCK_TIMEOUT_MS = 4 * ONE_SECOND_MS;

let initialized = false;

export interface SetupWorkflowsOptions {
  /** Max time to wait for the ScriptLock (ms). Default: 4s */
  lockTimeoutMs?: number;
  /** Whether to schedule a retry trigger if lock is busy. Default: true */
  allowRetryTrigger?: boolean;
}

// Single canonical adapter for the whole engine
const enqueueAdapter: EnqueueFn = (
  parameters: unknown,
  opts?: EnqueueOptions
) => {
  const runStepParameters = parameters as SerializedRunStepParameters;

  return queueJob(runStepParameters, toQueueOptions(opts));
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
        withLog(setupWorkflows)();
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

function setupWorkflows(): void {
  if (initialized && isEngineConfigured()) return; // idempotent

  // 1) Bind the enqueue implementation

  setEnqueue(enqueueAdapter);

  // 2) Ensure the registry exists before any handlers run
  // If your registerStep is idempotent, you can call this every time.
  registerAllWorkflows();

  initialized = true;
}

function toQueueOptions(opts?: EnqueueOptions):QueueEnqueueOptions {
  return {
    runAt:
      opts?.runAt instanceof Date && !isNaN(opts.runAt.getTime())
        ? opts.runAt
        : undefined,
    priority: opts?.priority,
    queuedBy: opts?.queuedBy ?? "",
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
