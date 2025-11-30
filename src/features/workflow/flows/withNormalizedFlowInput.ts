// withNormalizedFlowInput.ts
import type { StepContext, StepFn, StepResult } from "../workflowTypes";
import type { FlowInput, FlowName } from "./flowInputTypes";
import { normalizeFlowInput } from "./normalizeFlowInput";

export function withNormalizedFlowInput<T extends FlowName>(
  flowName: T,
  stepFn: StepFnForFlow<T>
): StepFn {
  return (ctx: StepContext) => {
    const normalizedInput = normalizeFlowInput(
      flowName,
      ctx.input as Partial<FlowInput<T>>
    );

    // Preserve all other context fields, just replace input
    return stepFn({
      ...ctx,
      input: normalizedInput,
    });
  };
}

type StepFnForFlow<T extends FlowName> = (
  ctx: Omit<StepContext, "input"> & { input: FlowInput<T> }
) => StepResult;
