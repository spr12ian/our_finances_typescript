import { FastLog, withLog } from "@logging";
import { buildAccountsMenu } from "../menus/buildAccountsMenu";
import { buildGasMenu } from "../menus/buildGasMenu";
import { buildSectionsMenu } from "../menus/buildSectionsMenu";

export function onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
  Logger.log("onOpen called");
  try {
    buildUiMenus(e);
  } catch (err) {
    FastLog.error(onOpen.name, err);
  }
}

export function buildUiMenus(e: GoogleAppsScript.Events.SheetsOnOpen) {
  const fn = buildUiMenus.name;
  FastLog.info(fn, "Called");

  const ui = SpreadsheetApp.getUi();

  withLog(buildAccountsMenu)(ui, e);
  withLog(buildGasMenu)(ui);
  withLog(buildSectionsMenu)(ui);
}
