// jobHandlers.ts (avoid importing queueFunctions to dodge cycles)
import { FIX_SHEET } from "./jobFIX_SHEET";
import { FORMAT_SHEET } from "./jobFORMAT_SHEET";
import { TRIM_SHEET } from "./jobTRIM_SHEET";
import { UPDATE_ACCOUNT_BALANCES } from "./jobUPDATE_ACCOUNT_BALANCES";
import { UPDATE_BALANCES } from "./jobUPDATE_BALANCES";
import { jobHandlers_registerRunStep } from "./jobHandlers_registerRunStep";
import type { HandlerMap } from "./queueTypes";

export const jobHandlers: HandlerMap = {
  FIX_SHEET,
  FORMAT_SHEET,
  TRIM_SHEET,
  UPDATE_ACCOUNT_BALANCES,
  UPDATE_BALANCES,
} as const;

jobHandlers_registerRunStep(jobHandlers);
