// queueStepFunctions.ts
// Central registry of step functions per workflow

import { makeStepLogger } from "../../features/workflow/makeStepLogger";
import { enqueueRunStep } from "../../features/workflow/workflowEngine"; // your queue implementation
import type {
  RunStepJob,
  StepContext,
  StepFn,
} from "../../features/workflow/workflowTypes";
import { FastLog } from "../../lib/FastLog";
import { ONE_MINUTE, ONE_SECOND } from "../../timeConstants";

// Registry of workflows and their steps
// e.g., WORKFLOWS["RecalculateBalances"]["ScanSheets"] = fn
const WORKFLOWS: Record<string, Record<string, StepFn>> = {};

// Register helper
export function registerStep(
  workflowName: string,
  stepName: string,
  fn: StepFn
) {
  if (!WORKFLOWS[workflowName]) WORKFLOWS[workflowName] = {};
  WORKFLOWS[workflowName][stepName] = fn;
}

// Generic runner (your queue handler calls only this)
export function runStep(job: RunStepJob) {
  const { workflowName, stepName } = job;
  const stepFn = WORKFLOWS[workflowName]?.[stepName];
  if (!stepFn)
    throw new Error(`No step registered: ${workflowName}.${stepName}`);

  const budgetMs = 25 * ONE_SECOND; // be conservative inside a 6-min GAS window
  const startedAt = Date.now();
  const logger = makeStepLogger({
    workflowId: job.workflowId,
    workflowName,
    stepName,
  });

  const ctx: StepContext = {
    workflowId: job.workflowId,
    workflowName,
    stepName,
    input: job.input,
    state: job.state || {},
    attempt: job.attempt ?? 0,
    budgetMs,
    startedAt,
    log: logger,
    now: () => Date.now(),
  };

  const res = stepFn(ctx);

  // The engine decides what to queue next (decoupled)
  switch (res.kind) {
    case "yield": {
      enqueueRunStep(
        {
          ...job,
          state: res.state,
          attempt: 0, // fresh attempt for continuation
        },
        res.delayMs
      );
      return;
    }
    case "next": {
      enqueueRunStep(
        {
          type: "RUN_STEP",
          workflowId: job.workflowId,
          workflowName,
          stepName: res.nextStep,
          input: job.input,
          state: res.state ?? {},
          attempt: 0,
        },
        res.delayMs
      );
      return;
    }
    case "complete": {
      // Optionally persist completion marker / emit event
      FastLog.log(`[${workflowName}] completed`, {
        workflowId: job.workflowId,
        output: res.output,
      });
      return;
    }
    case "fail": {
      const retryable = res.retryable !== false; // default retryable
      if (retryable && job.attempt < 5) {
        const backoff = Math.min(2 ** job.attempt * ONE_SECOND, ONE_MINUTE);
        enqueueRunStep(
          { ...job, attempt: job.attempt + 1 },
          res.delayMs ?? backoff
        );
      } else {
        // dead-letter
        FastLog.warn(
          `[${workflowName}.${stepName}] failed permanently`,
          res.reason
        );
        // enqueueDeadLetter(job, res.reason) // optional
      }
      return;
    }
  }
}
