// @workflow/workflowEngine.ts
import { toIso_ } from "@lib/dates";
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@logging";
import { JOB_RUN_STEP } from "@queue/queueConstants";
// ⬇️ Pull the canonical types + accessors from engineState
import { ONE_MINUTE, ONE_SECOND } from "@lib/timeConstants";
import { MAX_ATTEMPTS } from "@queue/queueConstants";
import {
  ENGINE_INSTANCE_ID,
  getEnqueue,
  isConfigured,
  setEnqueue,
  type EnqueueFn, // <-- use the one true EnqueueFn here
} from "./engineState";
import { makeStepLogger } from "./makeStepLogger";
import { getStep } from "./workflowRegistry";
import type { RunStepJob, StepContext } from "./workflowTypes";

export function configureWorkflowEngine(fn: EnqueueFn) {
  setEnqueue(fn);
}

export function isEngineConfigured() {
  return isConfigured();
}

export function runStep(job: RunStepJob): void {
  const fn = runStep.name;
  const startTime = FastLog.start(fn, `${job.workflowName}.${job.stepName}`, {
    workflowId: job.workflowId,
    attempt: job.attempt,
  });

  try {
    const stepFn = getStep(job.workflowName, job.stepName);
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

export function startWorkflow(
  workflowName: string,
  firstStep: string,
  input: unknown,
  initialState: Record<string, any> = {},
  priority?: number
) {
  const fn = startWorkflow.name;
  const t0 = FastLog.start(fn, workflowName, firstStep);
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
    const msg = getErrorMessage(err);
    FastLog.error(fn, msg);
    throw new Error(msg);
  } finally {
    FastLog.finish(fn, t0);
  }
}

function enqueueRunStep(job: RunStepJob, delayMs?: number, priority?: number) {
  const fn = enqueueRunStep.name;
  const t0 = FastLog.start(fn, job);
  try {
    const enqueue = getEnqueue();
    const runAtIso =
      delayMs && delayMs > 0
        ? toIso_(new Date(Date.now() + delayMs))
        : undefined;
    enqueue(JOB_RUN_STEP, job, { runAt: runAtIso, priority });
  } catch (err) {
    const msg = getErrorMessage(err);
    FastLog.error(fn, msg);
    throw new Error(msg);
  } finally {
    FastLog.finish(fn, t0, job);
  }
}

FastLog.log("workflowEngine loaded", { ENGINE_INSTANCE_ID });
