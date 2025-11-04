import { FastLog } from "@lib/logging";
import { getSheetByName } from "./getSheetByName";

export function goToSheetLastRow(sheetName: string) {
  const sheet = getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();

  FastLog.info(`Going to last row [${lastRow}]of sheet: ${sheetName}`);
  sheet.setActiveRange(sheet.getRange(lastRow, 1));
}
