import { FastLog } from "@logging";
import { createMenu } from "./createMenu";
import {
  accountSheetMenuItems,
  bankAccountsSheetMenuItems,
  gasMenuItems,
  sheetMenuItems,
} from "./menuItems";

export function buildGasMenu(ui: GoogleAppsScript.Base.Ui) {
  const startTime = FastLog.start(buildGasMenu.name);

  const accountSheetMenu = createMenu(
    ui,
    "Account sheet",
    accountSheetMenuItems
  );
  const sheetMenu = createMenu(ui, "Sheet", sheetMenuItems);
  const bankAccountsSheetMenu = createMenu(ui, "Bank accounts", bankAccountsSheetMenuItems);
  const gasMenu = createMenu(ui, "GAS Menu", gasMenuItems);
  gasMenu
    .addSeparator()
    .addSubMenu(bankAccountsSheetMenu)
    .addSeparator()
    .addSubMenu(accountSheetMenu)
    .addSeparator()
    .addSubMenu(sheetMenu)
    .addToUi();

  FastLog.finish(buildGasMenu.name, startTime);
}
