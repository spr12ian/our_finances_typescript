// @workflow/queueWorkflow.ts

import { FastLog, withLog } from "@logging";
import type { QueueWorkflowOptions } from "@queue";
import { enqueueRunStep } from "./enqueueRunStep";
import type { FlowName } from "./flows/flowInputTypes";
import { normalizeFlowInput } from "./flows/normalizeFlowInput";

export function queueWorkflow(
  workflowName: FlowName,
  firstStep: string,
  input: unknown,
  options: QueueWorkflowOptions = {}
): string | null {
  const fn = queueWorkflow.name;

  const { initialState = {}, priority, queuedBy } = options;

  FastLog.log(fn, workflowName, firstStep, queuedBy ?? "(no queuedBy)");

  const queueId = Utilities.getUuid();
  const normalizedInput = normalizeFlowInput(
    workflowName,
    input as any // single cast at the boundary
  );

  const delayMs = 0;
  withLog(enqueueRunStep)(
    {
      queueId,
      workflowName,
      stepName: firstStep,
      input: normalizedInput,
      state: initialState,
    },
    {
      delayMs,
      priority,
      queuedBy,
    }
  );

  return queueId;
}
