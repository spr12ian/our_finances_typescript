// normalizeFlowInput.ts

import { FLOW_INPUT_DEFAULTS_REGISTRY } from "./flowInputConstants";
import type { FlowName } from "./flowInputTypes";

export function normalizeFlowInput<
  TName extends FlowName
>(
  flowName: TName,
  input: Partial<(typeof FLOW_INPUT_DEFAULTS_REGISTRY)[TName]>
): (typeof FLOW_INPUT_DEFAULTS_REGISTRY)[TName] {
  return { ...FLOW_INPUT_DEFAULTS_REGISTRY[flowName], ...input };
}

