import { AccountSheet } from "./AccountSheet";
import { getExtendedSheet } from "./getExtendedSheet";
import { queueJob } from "./queueJob";
import type { ParamsOf } from "./queueTypes";
import { FastLog } from "./support/FastLog";

const JOB_NAME = "UPDATE_BALANCES";
export function UPDATE_BALANCES(parameters: ParamsOf<"UPDATE_BALANCES">): void {
  const startTime = FastLog.start(`${JOB_NAME}`, parameters);
  const { row, sheetName } = parameters;

  if (!row || row < 2) {
    FastLog.error("Invalid row for UPDATE_BALANCES", row);
    return;
  }

  const accountSheet = getExtendedSheet(sheetName) as AccountSheet;

  accountSheet.updateBalanceValues(row);

  queueJob("UPDATE_ACCOUNT_BALANCES", { sheetName: sheetName });

  FastLog.finish(`${JOB_NAME}`, startTime, parameters);
}
