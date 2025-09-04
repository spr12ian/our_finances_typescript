import { AccountSheet } from "./AccountSheet";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { queue_enqueue } from "./queueClient";
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

  queue_UPDATE_ACCOUNT_BALANCES(sheetName);

  FastLog.log("Finished UPDATE_BALANCES", parameters);
}

function queue_UPDATE_ACCOUNT_BALANCES(sheetName: string) {
  FastLog.log("Started queue_UPDATE_ACCOUNT_BALANCES", sheetName);
  try {
    const parameters = { sheetName: sheetName };
    queue_enqueue("UPDATE_ACCOUNT_BALANCES", parameters);
  } catch (err) {
    FastLog.error("queue_UPDATE_ACCOUNT_BALANCES error", err);
  }
  FastLog.log("Finished queue_UPDATE_ACCOUNT_BALANCES", sheetName);
}
