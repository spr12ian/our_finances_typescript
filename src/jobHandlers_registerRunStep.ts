// jobHandlers_registerRunStep.ts

import { runStep } from "./queueStepFunctions";
import { RunStepJob } from "./queueStepTypes";

declare function queueJob(
  jobName: string,
  parameters: unknown,
  options?: { runAt?: Date; priority?: number }
): { id: string; row: number };

// Single job name the queue understands:
export const JOB_RUN_STEP = "RUN_STEP";

// Handler mapping in your queue worker
export function jobHandlers_registerRunStep(
  jobHandlers: Record<string, (params: any) => any>
) {
  jobHandlers[JOB_RUN_STEP] = (params: RunStepJob) => runStep(params);
}
