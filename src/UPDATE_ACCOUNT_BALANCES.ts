import { AccountBalances } from "./AccountBalances";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { FastLog } from "./support/FastLog";
import type { ParamsOf } from "./queueTypes";

export function UPDATE_ACCOUNT_BALANCES(parameters: ParamsOf<"UPDATE_ACCOUNT_BALANCES">): void {
  FastLog.log("Started UPDATE_ACCOUNT_BALANCES", parameters);
  const { sheetName } = parameters;
  
  const spreadsheet = getFinancesSpreadsheet();
  const accountBalances = new AccountBalances(spreadsheet);
  accountBalances.updateAccountBalance(sheetName);
  FastLog.log("Finished UPDATE_ACCOUNT_BALANCES", parameters);
}
