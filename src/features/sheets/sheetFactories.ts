// sheetFactories.ts

import { FastLog } from "@lib/logging";
import * as SheetClasses from "../sheets";
import { factoryFromClass } from "./factoryFromClass";
import type { SheetFactory } from "./sheetFactoryTypes";

export const sheetFactories: Record<string, SheetFactory> = {
  "Account balances": factoryFromClass(SheetClasses.AccountBalances),
  "Assets": factoryFromClass(SheetClasses.Assets),
  "Bank accounts": factoryFromClass(SheetClasses.BankAccounts),
};
FastLog.info(
  "sheetFactories",
  `Defined ${Object.keys(sheetFactories).length} sheet factories`
);
