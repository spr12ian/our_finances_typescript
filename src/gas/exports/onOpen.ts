import { FastLog } from "@logging";
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
  Logger.log("buildUiMenus called");
  const ui = SpreadsheetApp.getUi();

  buildAccountsMenu(ui, e);
  buildGasMenu(ui);
  buildSectionsMenu(ui);
}
