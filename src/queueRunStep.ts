// queueRunStep.ts

import { RunStepJob } from "./queueStepTypes";
import { queueJob } from './queueJob';
import { toIso_ } from './DateFunctions';

// declare function queueJob(
//   jobName: string,
//   parameters: unknown,
//   options?: { runAt?: Date; priority?: number }
// ): { id: string; row: number };

// Single job name the queue understands:
export const JOB_RUN_STEP = "RUN_STEP";

// Adapter the engine uses to enqueue
export function queueRunStep(job: RunStepJob, delayMs?: number) {
  const runAt = toIso_(delayMs ? new Date(Date.now() + delayMs) : new Date());
  queueJob(JOB_RUN_STEP, job, { runAt });
}
