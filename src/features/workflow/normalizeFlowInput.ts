// normalizeFlowInput.ts

import { FLOW_INPUT_DEFAULTS_REGISTRY } from "./flowInputConstants";
import type { FlowInput, FlowName } from "./flowInputTypes";

export function normalizeFlowInput<TFlowName extends FlowName>(
  flowName: TFlowName,
  partial: Partial<FlowInput<TFlowName>>
): FlowInput<TFlowName> {
  const defaults = FLOW_INPUT_DEFAULTS_REGISTRY[flowName];
  // shallow merge is probably enough here
  return { ...defaults, ...partial };
}
