import { queueRunStep } from "./queueRunStep";
import { WorkflowId } from "./queueStepTypes";

export function startWorkflow(
  workflowName: string,
  firstStep: string,
  input: unknown,
  initialState: Record<string, any> = {}
): WorkflowId {
  const workflowId = Utilities.getUuid();
  queueRunStep({
    type: "RUN_STEP",
    workflowId,
    workflowName,
    stepName: firstStep,
    input,
    state: initialState,
    attempt: 0,
  });
  return workflowId;
}
