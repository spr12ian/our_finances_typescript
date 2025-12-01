// @workflow/queueWorkflow.ts

import { FastLog, withLog } from "@logging";
import { isEngineConfigured } from "./engineState";
import { enqueueRunStep } from "./enqueueRunStep";
import type { FlowName } from "./flows/flowInputTypes";
import { normalizeFlowInput } from "./flows/normalizeFlowInput";

export function queueWorkflow(
  workflowName: FlowName,
  firstStep: string,
  input: unknown,
  initialState: Record<string, any> = {},
  priority?: number
): string | null {
  const fn = queueWorkflow.name;
  FastLog.log(fn, workflowName, firstStep);

  if (!isEngineConfigured()) {
    FastLog.warn(
      fn,
      `Engine not configured — skipping ${workflowName}.${firstStep}`
    );
    return null;
  }

  const queueId = Utilities.getUuid();
  const normalizedInput = normalizeFlowInput(
    workflowName,
    input as any // single cast at the boundary
  );

  withLog(enqueueRunStep)(
    {
      queueId,
      workflowName,
      stepName: firstStep,
      input: normalizedInput,
      state: initialState,
    },
    /*delayMs*/ 0,
    priority
  );

  return queueId;
}
