// withNormalizedFlowInput.ts
import type { FlowInput, FlowName } from "./flows/flowInputTypes";
import { normalizeFlowInput } from "./flows/normalizeFlowInput";
import type { StepContext, StepFn, StepResult } from "./workflowTypes";

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
