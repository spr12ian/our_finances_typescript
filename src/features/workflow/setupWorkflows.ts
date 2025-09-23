// @workflow/setupWorkflows.ts
import { FastLog } from "@lib/logging";
import { FIVE_SECONDS } from "@lib/timeConstants";
import { queueJob } from "@queue/queueJob";
import type { EnqueueFn,EnqueueOptions } from "./engineState";
import { isConfigured, setEnqueue } from "./engineState";
import { registerAllWorkflows } from "./registerAllWorkflows";
import type { RunStepJob } from "./workflowTypes";

let initialized = false;

export function setupWorkflows(): void {
  const fn = setupWorkflows.name;
  const startTime = FastLog.start(fn);

  withScriptLock(() => {
    if (initialized && isConfigured()) return; // idempotent

    // 1) Inject an EnqueueFn-compatible wrapper (NOT queueJob directly)
    const enqueueAdapter: EnqueueFn = (
      parameters: unknown,
      opts?: EnqueueOptions
    ) => {
      const rsp = parameters as RunStepJob;

      // normalize runAt (engine side deals in Date|null)
      const runAt =
        opts?.runAt instanceof Date && !isNaN(opts.runAt.getTime())
          ? opts.runAt
          : null;

      // map EngineOpts -> QueueEnqueueOptions (you can add defaults here if you want)
      return queueJob(rsp, {
        runAt,
        priority: opts?.priority,
        // maxAttempts / dedupeKey can be added here if your engine later exposes them
      });
    };

    setEnqueue(enqueueAdapter);

    // 2) Ensure the registry exists before any handlers run
    // If your registerStep is idempotent, you can call this every time.
    registerAllWorkflows();

    initialized = true;
  });
  FastLog.finish(fn, startTime);
}

// GAS-only lock helper (no-op in Node tests)
function withScriptLock<T>(fn: () => T): T {
  // If you run this outside GAS, stub LockService.
  // @ts-ignore
  const lock =
    typeof LockService !== "undefined"
      ? // @ts-ignore
        LockService.getScriptLock()
      : null;

  if (lock) {
    lock.tryLock(FIVE_SECONDS); // best-effort
    try {
      return fn();
    } finally {
      lock.releaseLock();
    }
  } else {
    return fn();
  }
}
