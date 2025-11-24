// @workflow/workflowEngine.ts
import { getErrorMessage } from "@lib/errors";
import { FastLog, functionStart } from "@logging";
// ⬇️ Pull the canonical types + accessors from engineState
import { toHtmlParagraph } from "@lib/html/htmlFunctions";
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { withLog } from "@logging";
import {
  ENGINE_INSTANCE_ID,
  getEnqueue,
  isEngineConfigured,
} from "./engineState";
import { makeStepLogger } from "./makeStepLogger";
import { getStep } from "./workflowRegistry";
import type {
  RunStepJob,
  SerializedRunStepParameters,
  StepContext,
} from "./workflowTypes";

const DEFAULT_INVOCATION_BUDGET_MS = 25 * ONE_SECOND_MS;
export function runStep(job: RunStepJob): void {
  const fn = runStep.name;

  FastLog.log(fn, `${job.workflowName}.${job.stepName}`, {
    workflowId: job.workflowId,
    attempt: job.attempt,
  });

  const stepFn = getStep(job.workflowName, job.stepName);
  if (!stepFn)
    throw new Error(`No step registered: ${job.workflowName}.${job.stepName}`);

  const log = makeStepLogger({
    workflowId: job.workflowId,
    workflowName: job.workflowName,
    stepName: job.stepName,
  });

  const budgetMs = DEFAULT_INVOCATION_BUDGET_MS; // leave headroom inside Apps Script’s 6-min window

  const rawInput = job.input ?? null;
  const input =
    rawInput && typeof rawInput === "object"
      ? Object.freeze(rawInput as object)
      : rawInput;
  const state = job.state ?? {};

  const ctx: StepContext = {
    workflowId: job.workflowId,
    workflowName: job.workflowName,
    stepName: job.stepName,
    input: input,
    state: state,
    attempt: job.attempt ?? 0,
    budgetMs,
    startedAt: Date.now(),
    log,
    now: () => Date.now(),
  };

  const res = stepFn(ctx);
  FastLog.log(fn, {
    kind: res.kind,
    nextStep: res.kind === "next" ? res.nextStep : undefined,
    hasState: "state" in res,
    delayMs: "delayMs" in res ? res.delayMs : undefined,
  });

  switch (res.kind) {
    case "yield": {
      withLog(enqueueRunStep_)({ ...job, state: res.state }, res.delayMs);
      return;
    }
    case "next": {
      withLog(enqueueRunStep_)(
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
    case "fail": {
      // Let the batch handler decide attempts/backoff/dead-letter.
      FastLog.warn(`Step failed: ${job.workflowName}.${job.stepName}`, {
        workflowId: job.workflowId,
        reason: res.reason,
        attempt: job.attempt,
      });
      const htmlReason = toHtmlParagraph(res.reason);
      const input = { htmlBody: htmlReason, subject: job.stepName };

      withLog(queueWorkflow)(
        "sendMeHtmlEmailFlow",
        "sendMeHtmlEmailStep1",
        input
      );

      throw new Error(`runStep failed: ${String(res.reason)}`);
    }
  }
}

export function queueWorkflow(
  workflowName: string,
  firstStep: string,
  input: unknown,
  initialState: Record<string, any> = {},
  priority?: number
): string | null {
  const fn = queueWorkflow.name;
  const finish = functionStart(fn);
  FastLog.log(fn, workflowName, firstStep);
  try {
    if (!isEngineConfigured()) {
      FastLog.warn(
        fn,
        `Engine not configured — skipping ${workflowName}.${firstStep}`
      );
      return null;
    }
    const workflowId = Utilities.getUuid();
    withLog(enqueueRunStep_)(
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
    finish();
  }
}

function enqueueRunStep_(
  rsp: SerializedRunStepParameters,
  delayMs?: number,
  priority?: number
) {
  const fn = enqueueRunStep_.name;
  FastLog.log(fn, rsp);
  const enqueue = getEnqueue();
  const ms = Math.max(0, Math.floor(delayMs ?? 0));
  const runAt: Date | undefined =
    ms > 0 ? new Date(Date.now() + ms) : undefined;
  withLog(enqueue)(rsp, { runAt, priority }); // enqueue now accepts a Date
}

FastLog.log("workflowEngine loaded", { ENGINE_INSTANCE_ID });
