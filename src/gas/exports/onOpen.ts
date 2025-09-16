import { FastLog } from "@logging";
import { getAccountSheetNames } from "../../accountSheetFunctions";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { registerDynamicAccountFunctions } from "../../registerDynamicAccountFunctions";
import { buildAccountsMenu } from "../menus/buildAccountsMenu";
import { buildGasMenu } from "../menus/buildGasMenu";
import { buildSectionsMenu } from "../menus/buildSectionsMenu";

export function onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
  const startTime = FastLog.start(onOpen.name, e);
  try {
    const spreadsheet = getFinancesSpreadsheet();
    const accountSheetNames: string[] = getAccountSheetNames(spreadsheet);

    const ui = SpreadsheetApp.getUi();

    buildAccountsMenu(ui, accountSheetNames);

    buildGasMenu(ui);

    buildSectionsMenu(ui);

    registerDynamicAccountFunctions(accountSheetNames);
  } catch (err) {
    FastLog.error(onOpen.name, err);
  } finally {
    try {
      FastLog.finish(onOpen.name, startTime);
    } catch {}
  }
}
