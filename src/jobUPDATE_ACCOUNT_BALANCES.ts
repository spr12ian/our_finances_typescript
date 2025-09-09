import { getExtendedSheet } from "./getExtendedSheet";
import type { ParamsOf } from "./queueTypes";
import { FastLog } from "./support/FastLog";

const JOB_NAME = "UPDATE_ACCOUNT_BALANCES";
export function UPDATE_ACCOUNT_BALANCES(
  parameters: ParamsOf<"UPDATE_ACCOUNT_BALANCES">
): void {
  const startTime = FastLog.start(`${JOB_NAME}`, parameters);
  const { sheetName } = parameters;
  const accountBalances = getExtendedSheet("Account balances");

  accountBalances.updateAccountBalance(sheetName);
  FastLog.finish(`${JOB_NAME}`, startTime, parameters);
}
