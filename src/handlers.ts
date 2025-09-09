// handlers.ts (avoid importing queueFunctions to dodge cycles)
import { FIX_SHEET } from "./jobFIX_SHEET";
import { FORMAT_SHEET } from "./jobFORMAT_SHEET";
import { UPDATE_ACCOUNT_BALANCES } from "./jobUPDATE_ACCOUNT_BALANCES";
import { UPDATE_BALANCES } from "./jobUPDATE_BALANCES";
import type { HandlerMap } from "./queueTypes";

export const handlers: HandlerMap = {
  FIX_SHEET,
  FORMAT_SHEET,
  UPDATE_ACCOUNT_BALANCES,
  UPDATE_BALANCES,
} as const;
