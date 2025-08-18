import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";

export function goToSheetLastRow(sheetName: string) {
  const spreadsheet = getFinancesSpreadsheet();
  const sheet = spreadsheet.getSheet(sheetName);
  sheet.setActiveRange(sheet.raw.getRange(sheet.raw.getLastRow(), 1));
}
