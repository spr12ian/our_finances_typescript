// getExtendedSheet.ts
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@logging";
import { AccountSheet } from "../../AccountSheet";
import { isAccountSheetName } from "../../accountSheetFunctions";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { createCoreFactory } from "./Core/Core";
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

function getSheetFactory(
  sheetName: string
): SheetFactory {
  const fn = getSheetFactory.name;
  const startTime = FastLog.start(fn, sheetName);
  try {
    // Registry now stores FACTORIES

    let factory = sheetFactories[sheetName];
    if (!factory) {
      factory = createCoreFactory(sheetName);
    }

    //throw new Error(`No sheet factory found for sheetName: ${sheetName}`);
    return factory;
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
