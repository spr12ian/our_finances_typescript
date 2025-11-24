// @workflow/setupWorkflows.ts
import { FastLog, withLog } from "@lib/logging";
import { withScriptLock } from "@lib/withScriptLock";
import { queueJob } from "@queue/queueJob";
import type { EnqueueFn, EnqueueOptions } from "./engineState";
import { isEngineConfigured, setEnqueue } from "./engineState";
import { registerAllWorkflows } from "./registerAllWorkflows";
import type { RunStepJob } from "./workflowTypes";

let initialized = false;

// safe to call repeatedly; internal lock + flag
export function setupWorkflows(): void {
  const fn = setupWorkflows.name;
  const startTime = FastLog.start(fn);

  withScriptLock(
    () => {
      if (initialized && isEngineConfigured()) return; // idempotent

      // 1) Inject an EnqueueFn-compatible wrapper (NOT queueJob directly)
      const enqueueAdapter: EnqueueFn = (
        parameters: unknown,
        opts?: EnqueueOptions
      ) => {
        const runStepParameters = parameters as RunStepJob;

        // normalize runAt (engine side deals in Date|null)
        const runAt =
          opts?.runAt instanceof Date && !isNaN(opts.runAt.getTime())
            ? opts.runAt
            : null;

        // map EngineOpts -> QueueEnqueueOptions (you can add defaults here if you want)
        return withLog(queueJob)(runStepParameters, {
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
    },
    {
      strategy: "run-unlocked",
    }
  );
  FastLog.finish(fn, startTime);
}
