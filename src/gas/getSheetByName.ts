import { getActiveSpreadsheet } from "./getActiveSpreadsheet";

export function getSheetByName(
  sheetName: string
): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
  return sheet;
}
