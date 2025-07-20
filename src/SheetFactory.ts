/// <reference types="google-apps-script" />
import { isGasSheet } from "./GasSheetUtils";
import { Sheet } from "./Sheet";
import { getType } from "./TypeUtils";

/**
 * Creates a `Sheet` instance from flexible input:
 *   • string → sheet name
 *   • Sheet → returned as-is
 *   • GAS Sheet → wrapped
 *   • null → active sheet
 */
export function createSheet(input: unknown): Sheet {
  const xType = getType(input);

  if (xType === "string") {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      input as string
    );
    if (!sheet) throw new Error(`Sheet with name "${input}" not found`);
    return new Sheet(sheet);
  }

  if (xType === "object" && input instanceof Sheet) return input;

  if (isGasSheet(input)) {
    return new Sheet(input as GoogleAppsScript.Spreadsheet.Sheet);
  }

  if (input === null) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (!sheet) throw new Error("No active sheet found");
    return new Sheet(sheet);
  }

  throw new TypeError(`Unexpected input type: ${xType}`);
}
