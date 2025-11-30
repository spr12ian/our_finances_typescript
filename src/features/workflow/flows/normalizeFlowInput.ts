// normalizeFlowInput.ts
import { FLOW_INPUT_DEFAULTS_REGISTRY } from "./flowInputConstants";

export function normalizeFlowInput<
  T extends keyof typeof FLOW_INPUT_DEFAULTS_REGISTRY
>(
  flowName: T,
  input: Partial<(typeof FLOW_INPUT_DEFAULTS_REGISTRY)[T]>
): (typeof FLOW_INPUT_DEFAULTS_REGISTRY)[T] {
  return { ...FLOW_INPUT_DEFAULTS_REGISTRY[flowName], ...input };
}

