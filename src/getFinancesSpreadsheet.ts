import { Spreadsheet } from "./Spreadsheet";

export function getFinancesSpreadsheet() {
  const id =
    PropertiesService.getScriptProperties().getProperty(
      "FINANCES_SPREADSHEET_ID"
    ) ||
    PropertiesService.getUserProperties().getProperty(
      "FINANCES_SPREADSHEET_ID"
    );

  if (!id) throw new Error("FINANCES_SPREADSHEET_ID not set");

  return Spreadsheet.openById(id);
}
