// sheetFactories.ts

import type { Spreadsheet } from "@domain";
import { FastLog } from "@lib/logging";
import * as SheetClasses from "./classes";
import type { SheetConstructor, SheetFactory } from "./sheetFactoryTypes";

export const sheetFactories: Record<string, SheetFactory> = {
  "Account balances": factoryFromClass(SheetClasses.AccountBalances),
  Assets: factoryFromClass(SheetClasses.Assets),
  "Bank accounts": factoryFromClass(SheetClasses.BankAccounts),
};

type FactoryWithBuild<T> = SheetFactory<T> & { build: SheetFactory<T> };

function factoryFromClass<T>(
  SheetConstructor: SheetConstructor<T>
): FactoryWithBuild<T> {
  const f: SheetFactory<T> = (s: Spreadsheet) => new SheetConstructor(s);
  (f as FactoryWithBuild<T>).build = f;
  return f as FactoryWithBuild<T>;
}

FastLog.info(
  "sheetFactories",
  `Defined ${Object.keys(sheetFactories).length} sheet factories`
);
