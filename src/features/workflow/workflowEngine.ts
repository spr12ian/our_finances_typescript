// src/features/workflow/workflowEngine.ts

import { toIso_ } from "@lib/dates";
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@lib/logging/FastLog";
import { ONE_MINUTE, ONE_SECOND } from "@lib/timeConstants";
import { JOB_RUN_STEP, MAX_ATTEMPTS } from "@queue/queueConstants";
import type { EnqueueOptions, JobName } from "@queue/queueTypes";
import { makeStepLogger } from "./makeStepLogger";
import type { RunStepJob, StepContext, StepFn } from "./workflowTypes";

// Allow RUN_STEP even if it's not in JobName:
type InfraJobName = JobName | "RUN_STEP";

export type EnqueueFn = (
  jobName: InfraJobName,
  parameters: unknown,
  options?: EnqueueOptions
) => { id: string; row: number };

// Registry of step functions (workflowName -> stepName -> StepFn)
const WORKFLOWS: Record<string, Record<string, StepFn>> = Object.create(null);

// Register steps (call this at module top-level in each workflow file or in an init)
export function registerStep(
  workflowName: string,
  stepName: string,
  fn: StepFn
): void {
  if (!WORKFLOWS[workflowName]) WORKFLOWS[workflowName] = Object.create(null);
  WORKFLOWS[workflowName][stepName] = fn;
}

// ▶ Module-scoped variable to hold the real enqueuer
let ENQUEUE: EnqueueFn | null = null;

let _enqueue: EnqueueFn | null = null;
let _isConfigured = false;

// ▶ Public config called once to provide the enqueuer
export function configureWorkflowEngine(enqueue: EnqueueFn) {
  if (_isConfigured) return; // idempotent

  _enqueue = enqueue;
  _isConfigured = true;
}

// For code that needs the enqueue function later
export function getEnqueue(): EnqueueFn {
  if (!_enqueue) throw new Error("Workflow engine not configured.");
  return _enqueue;
}

// Enqueue the next RUN_STEP
export function enqueueRunStep(
  job: RunStepJob,
  delayMs?: number,
  priority?: number
): void {
  const fn = enqueueRunStep.name;
  const startTime = FastLog.start(fn, job);
  try {
    const enq = ENQUEUE; // capture to a non-null-checked local
    if (!enq) {
      throw new Error(
        "Workflow engine not configured: enqueue function not set. Call configureWorkflowEngine(queueJob) at startup."
      );
    }
    const runAt = toIso_(delayMs ? new Date(Date.now() + delayMs) : new Date());
    enq(JOB_RUN_STEP, job, { runAt, priority });
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, errorMessage);
    throw new Error(errorMessage);
  } finally {
    FastLog.finish(fn, startTime, job);
  }
}

// Public entry called by the handlers table
export function runStep(job: RunStepJob): void {
  const fn = runStep.name;
  const startTime = FastLog.start(fn, `${job.workflowName}.${job.stepName}`, {
    workflowId: job.workflowId,
    attempt: job.attempt,
  });

  try {
    const stepFn = WORKFLOWS[job.workflowName]?.[job.stepName];
    if (!stepFn)
      throw new Error(
        `No step registered: ${job.workflowName}.${job.stepName}`
      );

    const log = makeStepLogger({
      workflowId: job.workflowId,
      workflowName: job.workflowName,
      stepName: job.stepName,
    });

    const budgetMs = 25 * ONE_SECOND; // leave headroom inside Apps Script’s 6-min window
    const ctx: StepContext = {
      workflowId: job.workflowId,
      workflowName: job.workflowName,
      stepName: job.stepName,
      input: job.input,
      state: job.state || {},
      attempt: job.attempt ?? 0,
      budgetMs,
      startedAt: Date.now(),
      log,
      now: () => Date.now(),
    };

    const res = stepFn(ctx);
    FastLog.log(fn, res);

    switch (res.kind) {
      case "yield": {
        enqueueRunStep(
          { ...job, state: res.state, attempt: 0, type: "RUN_STEP" },
          res.delayMs
        );
        return;
      }
      case "next": {
        enqueueRunStep(
          {
            type: "RUN_STEP",
            workflowId: job.workflowId,
            workflowName: job.workflowName,
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
        FastLog.info(`Workflow complete: ${job.workflowName}`, {
          workflowId: job.workflowId,
          output: res.output,
        });
        return;
      }
      case "fail": {
        const retryable = res.retryable !== false;
        if (retryable && job.attempt < MAX_ATTEMPTS) {
          const backoff =
            res.delayMs ?? Math.min(2 ** job.attempt * ONE_SECOND, ONE_MINUTE);
          enqueueRunStep({ ...job, attempt: job.attempt + 1 }, backoff);
        } else {
          FastLog.warn(`Dead-letter: ${job.workflowName}.${job.stepName}`, {
            workflowId: job.workflowId,
            reason: res.reason,
          });
          // Optionally: enqueue to DEAD queue/sheet here
        }
        return;
      }
    }
  } catch (err) {
    FastLog.error(
      fn,
      `crash: ${job.workflowName}.${job.stepName}: ${
        (err as Error)?.message || err
      }`
    );
    // Best-effort retry with backoff
    const nextAttempt = (job.attempt ?? 0) + 1;
    const backoff = Math.min(2 ** (nextAttempt - 1) * ONE_SECOND, ONE_MINUTE);
    enqueueRunStep({ ...job, attempt: nextAttempt }, backoff);
    throw err;
  } finally {
    FastLog.finish(fn, startTime, `${job.workflowName}.${job.stepName}`);
  }
}

// Helper to start a workflow from anywhere (menu, button, queue, etc.)
export function startWorkflow(
  workflowName: string,
  firstStep: string,
  input: unknown,
  initialState: Record<string, any> = {},
  priority?: number
): string {
  const startTime = FastLog.start(
    startWorkflow.name,
    workflowName,
    firstStep,
    input,
    initialState,
    priority
  );
  try {
    const workflowId = Utilities.getUuid();
    enqueueRunStep(
      {
        type: "RUN_STEP",
        workflowId,
        workflowName,
        stepName: firstStep,
        input,
        state: initialState,
        attempt: 0,
      },
      /*delayMs*/ 0,
      priority
    );
    return workflowId;
  } catch (err) {
    FastLog.error(startWorkflow.name, err);
    throw err;
  } finally {
    FastLog.finish(startWorkflow.name, startTime);
  }
}

export function clearWorkflowRegistry() {
  for (const k of Object.keys(WORKFLOWS)) delete WORKFLOWS[k];
}
export function isEngineConfigured() {
  return _isConfigured;
}
