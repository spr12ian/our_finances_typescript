// handlers.ts (avoid importing queueFunctions to dodge cycles)
import type { HandlerMap } from "./queueTypes";
import { UPDATE_ACCOUNT_BALANCES } from "./UPDATE_ACCOUNT_BALANCES";
import { UPDATE_BALANCES } from "./UPDATE_BALANCES";

export const handlers: HandlerMap = {
  UPDATE_ACCOUNT_BALANCES,
  UPDATE_BALANCES,
} as const;
