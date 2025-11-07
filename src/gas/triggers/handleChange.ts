import { Sheet } from "@domain/Sheet";
import { getTriggerEventSheet } from "@gas/getTriggerEventSheet";
import { isSheetInIgnoreList } from "@lib/isSheetInIgnoreList";
import { isProgrammaticEdit } from "@lib/programmaticEditGuard";
import * as timeConstants from "@lib/timeConstants";
import { FastLog, functionStart } from "@logging";
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
    if (isSheetInIgnoreList(sheetName, fn)) return;

    const ignored = new Set([
      "FORMAT",
      "GRID_PROPERTIES_CHANGED",
      "INSERT_ROW",
      "OTHER",
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
          FastLog.log(
            "handleChange → Ignoring programmatic EDIT from our code"
          );
          return;
        } else {
          FastLog.log("handleChange → Some other script changed the sheet");
          return;
        }
        break;
      case "REMOVE_ROW":
        FastLog.log(`Row removed`);

        const spreadsheet = getFinancesSpreadsheet(e);

        const sheetId = gasSheet?.getSheetId?.() ?? "unknown";
        const ssId = spreadsheet.id ?? "unknown";
        const key = `ONCHANGE_BALANCE:${ssId}:${sheetId}:${changeType}`;
        const sheet = new Sheet(gasSheet);
        withReentryGuard(key, timeConstants.ONE_MINUTE_MS, () => {
          startFlow(sheet);
        });
        break;
      default:
        throw new Error(
          `Unhandled change event: ${JSON.stringify(e, null, 2)}`
        );
    }
  } catch (err) {
    FastLog.error(fn, `Error in handleChange: ${String(err)}`);
    throw err;
  } finally {
    FastLog.log(fn, `handleChange completed`);
  }
}

function startFlow(sheet: Sheet) {
  const finish = functionStart(startFlow.name);

  if (isAccountSheet(sheet)) {
    FastLog.log(`Sheet ${sheet.name} is an account sheet.`);
    setupWorkflowsOnce();
    startWorkflow(
      "updateAccountSheetBalancesFlow",
      "updateAccountSheetBalancesStep1",
      {
        sheetName: sheet.name,
        row: 1,
        startedBy: "handleChange",
      }
    );
  }

  finish();
}
