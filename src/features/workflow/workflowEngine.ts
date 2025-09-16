// @workflow/workflowEngine.ts
import { toIso_ } from "@lib/dates";
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@logging";
// ⬇️ Pull the canonical types + accessors from engineState
import { ONE_SECOND } from "@lib/timeConstants";
import {
  ENGINE_INSTANCE_ID,
  getEnqueue,
  isConfigured,
  setEnqueue,
  type EnqueueFn, // <-- use the one true EnqueueFn here
} from "./engineState";
import { makeStepLogger } from "./makeStepLogger";
import { getStep } from "./workflowRegistry";
import type {
  RunStepJob,
  SerializedRunStepParameters,
  StepContext,
} from "./workflowTypes";

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
        enqueueRunStep({ ...job, state: res.state }, res.delayMs);
        return;
      }
      case "next": {
        enqueueRunStep(
          {
            workflowId: job.workflowId,
            workflowName: job.workflowName,
            stepName: res.nextStep,
            input: job.input,
            state: res.state ?? {},
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
      case "fail":
        {
          // Let the batch handler decide attempts/backoff/dead-letter.
          FastLog.warn(`Step failed: ${job.workflowName}.${job.stepName}`, {
            workflowId: job.workflowId,
            reason: res.reason,
            attempt: job.attempt,
          });
          throw new Error(`runStep failed: ${String(res.reason)}`);
        }

        return;
    }
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(
      fn,
      `crash: ${job.workflowName}.${job.stepName}: ${errorMessage}`
    );

    throw new Error(errorMessage);
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
        workflowId,
        workflowName,
        stepName: firstStep,
        input,
        state: initialState,
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

function enqueueRunStep(
  rsp: SerializedRunStepParameters,
  delayMs?: number,
  priority?: number
) {
  const fn = enqueueRunStep.name;
  const t0 = FastLog.start(fn, rsp);
  try {
    const enqueue = getEnqueue();
    const runAtIso =
      delayMs && delayMs > 0
        ? toIso_(new Date(Date.now() + delayMs))
        : undefined;

    enqueue(rsp, { runAt: runAtIso, priority });
  } catch (err) {
    const msg = getErrorMessage(err);
    FastLog.error(fn, msg);
    throw new Error(msg);
  } finally {
    FastLog.finish(fn, t0, rsp);
  }
}

FastLog.log("workflowEngine loaded", { ENGINE_INSTANCE_ID });
