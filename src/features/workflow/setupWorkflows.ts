// src/workflow/workflowHandlers.ts
import { queueJob } from "@queue/queueJob";
import { registerAllWorkflows } from "./registerAllWorkflows";
import { configureWorkflowEngine, isEngineConfigured } from "./workflowEngine";

// GAS-only lock helper (no-op in Node tests)
function withScriptLock<T>(fn: () => T): T {
  // If you run this outside GAS, stub LockService.
  // @ts-ignore
  const lock = typeof LockService !== "undefined"
    // @ts-ignore
    ? LockService.getScriptLock()
    : null;

  if (lock) {
    lock.tryLock(5000); // best-effort
    try {
      return fn();
    } finally {
      lock.releaseLock();
    }
  } else {
    return fn();
  }
}

let initialized = false;

export function setupWorkflows(): void {
  withScriptLock(() => {
    if (initialized && isEngineConfigured()) return; // idempotent

    // 1) Inject the enqueue function (no queue import cycles here)
    configureWorkflowEngine(queueJob);

    // 2) Ensure the registry exists before any handlers run
    // If your registerStep is idempotent, you can call this every time.
    registerAllWorkflows();

    initialized = true;
  });
}
