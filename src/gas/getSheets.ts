import { getActiveSpreadsheet } from "./getActiveSpreadsheet";

export function getSheets(): GoogleAppsScript.Spreadsheet.Sheet[] {
  return getActiveSpreadsheet().getSheets();
}
