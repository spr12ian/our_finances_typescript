// src/workflow/makeStepLogger.ts
import { FastLog } from "../support/FastLog";
import { getErrorMessage } from "../support/errors";
import type { StepLogger } from "./logging";

type Ctx = {
  workflowId: string;
  workflowName: string;
  stepName: string;
};

const fmt = (ctx: Ctx) =>
  `[wf=${ctx.workflowName} id=${ctx.workflowId} step=${ctx.stepName}]`;

export function makeStepLogger(ctx: Ctx): StepLogger {
  const prefix = fmt(ctx);

  const base = ((msg: string, ...args: any[]) => {
    FastLog.log(`${prefix} ${msg}`, ...args);
  }) as StepLogger;

  base.error = (err: unknown, ...args: any[]) => {
    FastLog.error(getErrorMessage(err), `${prefix}`, ...args);
  };

  base.start = (fn: string, ...args: any[]) => {
    return FastLog.start(`${prefix}${fn ? " " + fn : ""}`, ...args);
  };

  base.finish = (fn: string, startTime: Date) => {
    FastLog.finish(`${prefix}${fn ? " " + fn : ""}`, startTime);
  };

  return base;
}
