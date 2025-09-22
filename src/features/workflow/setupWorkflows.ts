// @workflow/setupWorkflows.ts
import { FastLog } from "@lib/logging";
import { queueJob } from "@queue/queueJob";
import { registerAllWorkflows } from "./registerAllWorkflows";
import { setEnqueue, isConfigured } from "./engineState";
import { FIVE_SECONDS } from '@lib/timeConstants';

let initialized = false;

export function setupWorkflows(): void {
  const fn = setupWorkflows.name;
  const startTime = FastLog.start(fn);
  withScriptLock(() => {
    if (initialized && isConfigured()) return; // idempotent

    // 1) Inject the enqueue function (no queue import cycles here)
    setEnqueue(queueJob);

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
