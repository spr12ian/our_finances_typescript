import type { Sheet } from "@domain/Sheet";
import * as timeConstants from "@lib/timeConstants";
import { FastLog, functionStart } from "@logging";
import { isAccountSheet } from "@sheets/accountSheetFunctions";
import { setupWorkflows } from "@workflow";
import { startWorkflow } from "@workflow/workflowEngine";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";
import { withReentryGuard } from "../../withReentryGuard";

export function onChange(e: GoogleAppsScript.Events.SheetsOnChange): void {
  const finish = functionStart(onChange.name);
  try {
    FastLog.log(`Started OurFinances.onChange`);
    const ignored = new Set([
      "FORMAT",
      "GRID_PROPERTIES_CHANGED",
      "INSERT_ROW",
      "PROTECTED_RANGE",
    ]);

    const changeType = String(e.changeType || "OTHER");
    if (ignored.has(changeType)) {
      FastLog.log(`Ignored changeType: ${changeType}`);
      return;
    }

    switch (e.changeType) {
      case "REMOVE_ROW":
        FastLog.log(`Row removed`);

        const spreadsheet = getFinancesSpreadsheet(e);
        const sheet = spreadsheet.activeSheet;
        const sheetId = sheet?.raw.getSheetId?.() ?? "unknown";
        const ssId = spreadsheet.id ?? "unknown";
        const key = `ONCHANGE_BALANCE:${ssId}:${sheetId}:${changeType}`;
        withReentryGuard(key, timeConstants.ONE_MINUTE, () => {
          startFlow(sheet);
        });
        break;
      default:
        throw new Error(
          `Unhandled change event: ${JSON.stringify(e, null, 2)}`
        );
    }

    FastLog.log(`Finished OurFinances.onChange`);
  } catch (err) {
    FastLog.error(onChange.name, err);
  } finally {
    finish();
  }
}

function startFlow(sheet: Sheet) {
  const finish = functionStart(startFlow.name);


  if (isAccountSheet(sheet)) {
    FastLog.log(`Sheet ${sheet.name} is an account sheet.`);
    setupWorkflows();
    startWorkflow(
      "updateAccountSheetBalancesFlow",
      "updateAccountSheetBalancesStep1",
      {
        sheetName: sheet.name,
        row: 1,
        startedBy: "onChange",
      }
    );
  }

  finish();
}
