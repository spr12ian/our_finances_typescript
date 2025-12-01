// @workflow/workflowEngine.ts
import { FastLog } from "@logging";
// ⬇️ Pull the canonical types + accessors from engineState
import { toHtmlParagraph } from "@lib/html/htmlFunctions";
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { withLog } from "@logging";
import { makeStepLogger } from "./makeStepLogger";
import { queueWorkflow } from "./queueWorkflow";
import { getStep } from "./workflowRegistry";
import type { RunStepJob, StepContext } from "./workflowTypes";
import { enqueueRunStep } from './enqueueRunStep';

const DEFAULT_INVOCATION_BUDGET_MS = 25 * ONE_SECOND_MS;

export function runStep(job: RunStepJob): void {
  const fn = runStep.name;

  FastLog.log(fn, `${job.workflowName}.${job.stepName}`, {
    queueId: job.queueId,
    attempt: job.attempt,
  });

  const stepFn = getStep(job.workflowName, job.stepName);
  if (!stepFn)
    throw new Error(`No step registered: ${job.workflowName}.${job.stepName}`);

  const log = makeStepLogger({
    queueId: job.queueId,
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
    queueId: job.queueId,
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
      withLog(enqueueRunStep)({ ...job, state: res.state }, res.delayMs);
      return;
    }
    case "next": {
      withLog(enqueueRunStep)(
        {
          queueId: job.queueId,
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
        queueId: job.queueId,
        output: res.output,
      });
      return;
    }
    case "fail": {
      // Let the batch handler decide attempts/backoff/dead-letter.
      FastLog.warn(`Step failed: ${job.workflowName}.${job.stepName}`, {
        queueId: job.queueId,
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
