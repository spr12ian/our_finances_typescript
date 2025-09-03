import { AccountBalances } from "./AccountBalances";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { FastLog } from "./support/FastLog";

export function UPDATE_ACCOUNT_BALANCES(parameters: {
  sheetName: string;
}): void {
  FastLog.log("UPDATE_ACCOUNT_BALANCES started", parameters);
  const spreadsheet = getFinancesSpreadsheet();
  const accountBalances = new AccountBalances(spreadsheet);
  accountBalances.updateAccountBalance(parameters.sheetName);
  FastLog.log("UPDATE_ACCOUNT_BALANCES finished");
}
