// getExtendedSheet.ts
import { AccountSheet } from "../../AccountSheet";
import { BankAccounts } from "../../BankAccounts";
//import { BankCards } from "./BankCards";
import type { Spreadsheet } from "@domain/Spreadsheet";
import { isAccountSheetName } from "../../accountSheetFunctions";
//import { AccountBalances } from "./app/sheets/AccountBalances";
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@lib/logging/FastLog";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { createAccountBalances } from "./AccountBalances/AccountBalances";

export interface ExtendedSheet {
  name: string;
}

export interface canFixSheet {
  fixSheet: () => void;
}

export interface canFormatSheet {
  formatSheet: () => void;
}

export interface canTrimSheet {
  trimSheet: () => void;
}

export interface canUpdateAccountBalance {
  updateAccountBalance: (sheetName: string) => void;
}

// Type guards (optional but handy)
export const hasFixSheet = (
  x: ExtendedSheet
): x is ExtendedSheet & canFixSheet =>
  typeof (x as any).fixSheet === "function";

export const hasFormatSheet = (
  x: ExtendedSheet
): x is ExtendedSheet & canFormatSheet =>
  typeof (x as any).formatSheet === "function";

export const hasTrimSheet = (
  x: ExtendedSheet
): x is ExtendedSheet & canTrimSheet =>
  typeof (x as any).trimSheet === "function";

export const hasUpdateAccountBalance = (
  x: ExtendedSheet
): x is ExtendedSheet & canUpdateAccountBalance =>
  typeof (x as any).updateAccountBalance === "function";

// If every non-account sheet takes only spreadsheet:
export type SheetCtor = new (spreadsheet: Spreadsheet) => ExtendedSheet;
type SheetFactory = (spreadsheet: Spreadsheet) => ExtendedSheet;

export function getExtendedSheet(sheetName: string): ExtendedSheet {
  const fn = getExtendedSheet.name;
  const startTime = FastLog.start(fn, sheetName);
  try {
    const spreadsheet = getFinancesSpreadsheet();
    if (isAccountSheetName(sheetName)) {
      const sheet = spreadsheet.getSheet(sheetName);
      if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found`);
      }
      return new AccountSheet(sheet, spreadsheet);
    }

    const make = getSheetFactory(sheetName);
    if (!make) {
      throw new Error(`Sheet factory for ${sheetName} not found`);
    }

    return make(spreadsheet);
  } catch (err) {
    FastLog.error(fn, err);
    throw new Error(`${fn}: ${getErrorMessage(err)}`);
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
type SheetClassConstructor = new (...args: any[]) => ExtendedSheet;

export function getSheetFactory(sheetName: string): SheetFactory {
  const fn = getSheetFactory.name;
  const startTime = FastLog.start(fn, sheetName);
  try {
    // Registry now stores FACTORIES
    const factories: Record<string, SheetFactory> = {
      "Account balances": createAccountBalances, // ✅ new factory sheet
      //"Bank accounts":    (s) => new BankAccounts(s),     // ✅ wrap old ctor
      //"Bank cards":       (s) => new BankCards(s),        // ✅ wrap old ctor
      // add others the same way
    };

    const f = factories[sheetName];
    if (!f)
      throw new Error(`No sheet factory found for sheetName: ${sheetName}`);
    return f;
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}

export function getSheetClass(sheetName: string): SheetClassConstructor {
  const fn = getSheetClass.name;
  const startTime = FastLog.start(fn, sheetName);

  try {
    // Implementation to get the correct sheet class based on the sheetName
    // For example, you might have a mapping of sheet names to classes
    const sheetClassMap: { [key: string]: any } = {
      "Account balances": createAccountBalances,
      "Bank accounts": BankAccounts,
      // "Bank cards": BankCards,
      // "BudgetSheet": BudgetSheet,
      // Add other mappings as necessary
    };
    const sheetClass = sheetClassMap[sheetName];
    if (!sheetClass) {
      throw new Error(`No sheet class found for sheetName: ${sheetName}`);
    }
    return sheetClass;
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
