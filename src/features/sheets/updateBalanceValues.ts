// updateAccountSheetBalances.ts
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@logging/FastLog";
import { AccountSheet } from "@sheets/classes/AccountSheet";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { isAccountSheetName } from "./accountSheetFunctions";

export function updateAccountSheetBalances(
  sheetName: string,
  row: number
): boolean {
  const fn = updateAccountSheetBalances.name;
  const startTime = FastLog.start(fn, sheetName);
  try {
    if (isAccountSheetName(sheetName)) {
      const spreadsheet = getFinancesSpreadsheet();
      const sheet = spreadsheet.getSheet(sheetName);
      if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found`);
      }
      const accountSheet = new AccountSheet(sheet, spreadsheet);

      accountSheet.updateAccountSheetBalances(row);
      return true;
    } else {
      throw new Error(`${sheetName} is NOT an account sheet`);
    }
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, "failed", { sheetName, errorMessage });

    throw new Error(errorMessage);
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
