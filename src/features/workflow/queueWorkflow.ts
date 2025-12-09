// @workflow/queueWorkflow.ts

import { FastLog, withLog } from "@logging";
import type { QueueWorkflowOptions } from "@queue";
import { enqueueRunStep } from "./enqueueRunStep";
import { normalizeFlowInput } from "./normalizeFlowInput";
import type { FlowInput, FlowName } from "./workflowTypes";

export function queueWorkflow<TFlowName extends FlowName>(
  workflowName: TFlowName,
  firstStep: string,
  input: Partial<FlowInput<TFlowName>>,
  options: QueueWorkflowOptions = {}
): string {
  const fn = queueWorkflow.name;

  const { initialState = {}, priority, queuedBy } = options;

  FastLog.log(fn, workflowName, firstStep, queuedBy ?? "(no queuedBy)");

  const queueId = Utilities.getUuid();
  const normalizedInput = normalizeFlowInput(workflowName, input);

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
