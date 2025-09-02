import { AccountSheet } from "./AccountSheet";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { FastLog } from "./support/FastLog";

export function UPDATE_BALANCES(parameters: {
  sheetName: string;
  row: number;
}): void {
  FastLog.log("UPDATE_BALANCES started", parameters);
  const spreadsheet = getFinancesSpreadsheet();
  const accountSheet = new AccountSheet(
    spreadsheet.getSheet(parameters.sheetName),
    spreadsheet
  );
  accountSheet.updateBalanceValues(parameters.row);
  FastLog.log("UPDATE_BALANCES finished");
}
