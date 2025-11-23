import { Sheet } from "@domain/Sheet";
import { getTriggerEventSheet } from "@gas/getTriggerEventSheet";
import { isSheetInIgnoreList } from "@lib/isSheetInIgnoreList";
import { isProgrammaticEdit } from "@lib/programmaticEditGuard";
import * as timeConstants from "@lib/timeConstants";
import { FastLog, withLog } from "@logging";
import { isAccountSheet } from "@sheets/accountSheetFunctions";
import { setupWorkflowsOnce } from "@workflow";
import { startWorkflow } from "@workflow/workflowEngine";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";
import { withReentryGuard } from "../../lib/withReentryGuard";

export function handleChange(e: GoogleAppsScript.Events.SheetsOnChange): void {
  const fn = handleChange.name;

  try {
    const gasSheet = getTriggerEventSheet(e);
    const sheetName = gasSheet.getName();
    if (isSheetInIgnoreList(sheetName, fn)) {
      FastLog.log(
        fn,
        `Sheet ${sheetName} is in ignore list; skipping change handling.`
      );
      return;
    }

    const ignored = new Set([
      "FORMAT",
      "GRID_PROPERTIES_CHANGED",
      "PROTECTED_RANGE",
    ]);

    const changeType = String(e.changeType);
    if (ignored.has(changeType)) {
      FastLog.log(fn, `Ignored changeType: ${changeType}`);
      return;
    }

    switch (e.changeType) {
      case "EDIT":
        if (isProgrammaticEdit()) {
          FastLog.log(fn, "Ignoring programmatic EDIT from our code");
          return;
        } else {
          FastLog.log(fn, "Some other script changed the sheet");
          return;
        }
        break;
      case "INSERT_COLUMN":
        FastLog.log(fn, `Column inserted`);
        break;
      case "INSERT_ROW":
        FastLog.log(fn, `Row inserted`);
        break;
      case "OTHER":
        FastLog.log(fn, `Other change`);
        withLog(fn, recalcFutureBalances_)(new Sheet(gasSheet));
        break;
      case "REMOVE_ROW":
        FastLog.log(fn, `Row removed`);

        const spreadsheet = getFinancesSpreadsheet(e);

        const sheetId = gasSheet?.getSheetId?.() ?? "unknown";
        const ssId = spreadsheet.id ?? "unknown";
        const key = `ONCHANGE_BALANCE:${ssId}:${sheetId}:${changeType}`;
        withReentryGuard(key, timeConstants.ONE_MINUTE_MS, () => {
          withLog(fn, startFlow_)(new Sheet(gasSheet));
        });
        break;
      default:
        throw new Error(
          `${fn}: Unhandled change event: ${JSON.stringify(e, null, 2)}`
        );
    }
  } catch (err) {
    FastLog.error(fn, `Error in handleChange: ${String(err)}`);
    throw err;
  } finally {
    FastLog.log(fn, `handleChange completed`);
  }
}

function recalcFutureBalances_(sheet: Sheet): void {
  const lastRow = sheet.raw.getLastRow();
  if (lastRow <= 1) return; // only headers

  // Get all data rows (A:H) in one call
  const dataRange = sheet.raw.getRange(2, 1, lastRow - 1, 8);
  const data = dataRange.getValues();

  // Find first FUTURE row (by Note column, E => index 4)
  let firstFutureIndex = -1;
  for (let i = 0; i < data.length; i++) {
    const note = (data[i][4] ?? "").toString().trim().toUpperCase();
    if (note === "FUTURE") {
      firstFutureIndex = i;
      break;
    }
  }

  if (firstFutureIndex === -1) {
    // No FUTURE rows on this sheet
    return;
  }

  const firstFutureRow = firstFutureIndex + 2; // +2 because data starts at row 2

  // Starting balance is the balance in the row *above* the first FUTURE row
  const startingRow = firstFutureRow - 1;
  const startingBalance =
    Number(sheet.raw.getRange(startingRow, 8).getValue()) || 0;

  // Now work only on the FUTURE block
  // (from firstFutureRow down until Note stops being FUTURE)
  let running = startingBalance;
  const newBalances: number[][] = [];
  let writeLength = 0;

  for (let r = firstFutureIndex; r < data.length; r++) {
    const note = (data[r][4] ?? "").toString().trim().toUpperCase();
    if (note !== "FUTURE") break; // stop when FUTURE block ends

    const credit = Number(data[r][2]) || 0; // col C
    const debit = Number(data[r][3]) || 0; // col D
    running += credit - debit;

    newBalances.push([running]);
    writeLength++;
  }

  if (writeLength > 0) {
    sheet.raw
      .getRange(firstFutureRow, 8, writeLength, 1) // col H
      .setValues(newBalances);
  }
}

function startFlow_(sheet: Sheet) {
  const fn = startFlow_.name;

  if (isAccountSheet(sheet)) {
    FastLog.log(fn, `Sheet ${sheet.name} is an account sheet.`);
  } else {
    FastLog.log(fn, `Sheet ${sheet.name} is NOT an account sheet.`);
    return;
  }

  setupWorkflowsOnce();
  withLog(fn, startWorkflow)(
    "updateAccountSheetBalancesFlow",
    "updateAccountSheetBalancesStep1",
    {
      sheetName: sheet.name,
      row: 1,
      queuedBy: "handleChange",
    }
  );
}
