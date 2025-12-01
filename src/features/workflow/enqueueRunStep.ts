// @workflow/enqueueRunStep.ts

import { FastLog, withLog } from "@logging";
import { getEnqueue, isEngineConfigured } from "./engineState";
import type { SerializedRunStepParameters } from "./workflowTypes";
import { setupWorkflowsOnce } from "./setupWorkflowsOnce";

export interface EnqueueRunStepOptions {
  delayMs?: number;
  priority?: number;
  queuedBy?: string | null;
}

export function enqueueRunStep(
  rsp: SerializedRunStepParameters,
  options: EnqueueRunStepOptions = {}
) {
  const fn = enqueueRunStep.name;
  FastLog.log(fn, rsp);
  const { delayMs = 0, priority, queuedBy } = options;

  if (!isEngineConfigured()) {
    setupWorkflowsOnce({ allowRetryTrigger: false });
  }

  const enqueue = getEnqueue();
  const ms = Math.max(0, Math.floor(delayMs ?? 0));
  const runAt: Date | undefined =
    ms > 0 ? new Date(Date.now() + ms) : undefined;
  withLog(enqueue)(rsp, { runAt, priority, queuedBy });
}
