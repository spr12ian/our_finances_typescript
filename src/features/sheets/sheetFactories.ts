// sheetFactories.ts

import { factoryFromClass } from "@lib/factoryFromClass";
import { FastLog } from "@lib/logging";
import { BankAccounts } from "@sheets/BankAccounts";
import { createAccountBalances } from "./AccountBalances/AccountBalances";
import { createAssets } from "./Assets/Assets";
import type { SheetFactory } from "./sheetFactoryTypes";

export const sheetFactories: Record<string, SheetFactory> = {
  "Account balances": createAccountBalances,
  Assets: createAssets,
  "Bank accounts": factoryFromClass(BankAccounts),
};
FastLog.info(
  "sheetFactories",
  `Defined ${Object.keys(sheetFactories).length} sheet factories`
);
