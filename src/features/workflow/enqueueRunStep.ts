// @workflow/workflowEngine.ts

import { FastLog, withLog } from "@logging";
import { getEnqueue } from "./engineState";
import type { SerializedRunStepParameters } from "./workflowTypes";

export function enqueueRunStep(
  rsp: SerializedRunStepParameters,
  delayMs?: number,
  priority?: number
) {
  const fn = enqueueRunStep.name;
  FastLog.log(fn, rsp);
  const enqueue = getEnqueue();
  const ms = Math.max(0, Math.floor(delayMs ?? 0));
  const runAt: Date | undefined =
    ms > 0 ? new Date(Date.now() + ms) : undefined;
  withLog(enqueue)(rsp, { runAt, priority }); // enqueue now accepts a Date
}
