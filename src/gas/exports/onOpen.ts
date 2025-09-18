import { FastLog } from "@logging";
import { buildAccountsMenu } from "../menus/buildAccountsMenu";
import { buildGasMenu } from "../menus/buildGasMenu";
import { buildSectionsMenu } from "../menus/buildSectionsMenu";

export function onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
  const startTime = FastLog.start(onOpen.name, e);
  try {
    buildUiMenus();
  } catch (err) {
    FastLog.error(onOpen.name, err);
  } finally {
    try {
      FastLog.finish(onOpen.name, startTime);
    } catch {}
  }
}

export function buildUiMenus() {
  const ui = SpreadsheetApp.getUi();

  buildAccountsMenu(ui);
  buildGasMenu(ui);
  buildSectionsMenu(ui);
}
