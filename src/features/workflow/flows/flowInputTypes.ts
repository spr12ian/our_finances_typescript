// flowInputTypes.ts

import { FLOW_INPUT_DEFAULTS_REGISTRY } from "./flowInputConstants";

export type FlowInput<T extends FlowName> =
  (typeof FLOW_INPUT_DEFAULTS_REGISTRY)[T];

export type FlowName = keyof typeof FLOW_INPUT_DEFAULTS_REGISTRY;

export type UpdateBalanceValuesFlowInput =
  FlowInput<"accountSheetBalanceValuesFlow">;
