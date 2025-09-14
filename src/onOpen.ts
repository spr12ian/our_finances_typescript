import { getAccountSheetNames } from "./accountSheetFunctions";
import { buildAccountsMenu } from "./gas/menus/buildAccountsMenu";
import { buildGasMenu } from "./gas/menus/buildGasMenu";
import { buildSectionsMenu } from "./gas/menus/buildSectionsMenu";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { FastLog } from "./lib/FastLog";
import { registerDynamicAccountFunctions } from "./registerDynamicAccountFunctions";

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
