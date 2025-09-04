import { AccountSheet } from "./AccountSheet";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { queueJob } from "./queueJob";
import type { ParamsOf } from "./queueTypes";
import { FastLog } from "./support/FastLog";

export function UPDATE_BALANCES(parameters: ParamsOf<"UPDATE_BALANCES">): void {
  FastLog.log("Started UPDATE_BALANCES", parameters);
  const { row, sheetName } = parameters;

  if (!row || row < 2) {
    FastLog.error("Invalid row for UPDATE_BALANCES", row);
    return;
  }

  const spreadsheet = getFinancesSpreadsheet();
  const accountSheet = new AccountSheet(
    spreadsheet.getSheet(sheetName),
    spreadsheet
  );

  accountSheet.updateBalanceValues(row);

  queueJob("UPDATE_ACCOUNT_BALANCES", { sheetName: sheetName });

  FastLog.log("Finished UPDATE_BALANCES", parameters);
}
