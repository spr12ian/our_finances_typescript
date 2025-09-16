// jobDispatcher.ts
import type { RunStepJob } from "@workflow";
import { runStep } from "@workflow/workflowEngine";
import { JOB_RUN_STEP } from "./queueConstants";

export type InfraJobName = typeof JOB_RUN_STEP;

export function handleJob(name: InfraJobName, params: unknown) {
  switch (name) {
    case JOB_RUN_STEP:
      return runStep(assertRunStepJob(params));
    default:
      return assertNever(name);
  }
}

function assertRunStepJob(x: unknown): RunStepJob {
  if (!x || typeof x !== "object") throw new Error("RUN_STEP params missing");
  const p = x as Partial<RunStepJob>;
  if (typeof p.workflowName !== "string")
    throw new Error("workflowName missing");
  if (typeof p.stepName !== "string") throw new Error("stepName missing");
  // Add stricter checks here if you like (e.g., typeof p.attempt === "number")
  return p as RunStepJob;
}

function assertNever(_x: never): never {
  throw new Error("Unknown job name");
}
