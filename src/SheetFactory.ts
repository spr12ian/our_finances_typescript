/// <reference types="google-apps-script" />

import { isGasSheet } from "./GasSheetUtils";
import { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
import { getType } from "./TypeUtils";

/**
 * Creates a `Sheet` instance from flexible input:
 */
export function createSheet(input: unknown): Sheet {
  const xType = getType(input);

  if (xType === "object" && input instanceof Sheet) return input;

  if (xType === "string") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const gasSheet = ss.getSheetByName(input as string);
    if (!gasSheet) throw new Error(`Sheet with name "${input}" not found`);
    return new Sheet(gasSheet, () => Spreadsheet.openById(ss.getId()));
  }

  if (isGasSheet(input)) {
    const gasSheet = input as GoogleAppsScript.Spreadsheet.Sheet;
    return new Sheet(gasSheet, () =>
      Spreadsheet.openById(gasSheet.getParent().getId())
    );
  }

  if (input === null) {
    const gasSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (!gasSheet) throw new Error("No active sheet found");
    return new Sheet(gasSheet, () =>
      Spreadsheet.openById(gasSheet.getParent().getId())
    );
  }

  throw new TypeError(`Unexpected input type: ${xType}`);
}
