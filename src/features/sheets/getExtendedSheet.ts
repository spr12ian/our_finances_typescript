// getExtendedSheet.ts
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@logging";
import { AccountSheet } from "../../AccountSheet";
import { BankAccounts } from "../../BankAccounts";
import { isAccountSheetName } from "../../accountSheetFunctions";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { createAccountBalances } from "./AccountBalances/AccountBalances";
import { sheetFactories } from "./sheetFactories";
import type { ExtendedSheet, SheetFactory } from "./sheetTypes";

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

function getSheetFactory(sheetName: string): SheetFactory {
  const fn = getSheetFactory.name;
  const startTime = FastLog.start(fn, sheetName);
  try {
    // Registry now stores FACTORIES

    const factory = sheetFactories[sheetName];
    if (!factory)
      throw new Error(`No sheet factory found for sheetName: ${sheetName}`);
    return factory;
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
