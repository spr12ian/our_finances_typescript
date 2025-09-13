// getExtendedSheet.ts
import { AccountSheet } from "./AccountSheet";
import { BankAccounts } from "./BankAccounts";
import type { Spreadsheet } from "./Spreadsheet";
import { isAccountSheetName } from "./accountSheetFunctions";
import { AccountBalances } from "./app/sheets/AccountBalances";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { FastLog } from "./support/FastLog";
import { getErrorMessage } from "./support/errors";

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

    const SheetClass = getSheetClass(sheetName);
    if (!SheetClass) {
      throw new Error(`Sheet class for ${sheetName} not found`);
    }

    return new SheetClass(spreadsheet);
  } catch (err) {
    FastLog.error(fn, err);
    throw new Error(`${fn}: ${getErrorMessage(err)}`);
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
type SheetClassConstructor = new (...args: any[]) => ExtendedSheet;
export function getSheetClass(sheetName: string): SheetClassConstructor {
  const fn = getSheetClass.name;
  const startTime = FastLog.start(fn, sheetName);

  try {
    // Implementation to get the correct sheet class based on the sheetName
    // For example, you might have a mapping of sheet names to classes
    const sheetClassMap: { [key: string]: any } = {
      "Account balances": AccountBalances,
      "Bank accounts": BankAccounts,
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
