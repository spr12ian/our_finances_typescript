import { FastLog } from "@logging";
import { createMenu } from "./createMenu";

export function buildAccountsMenu(
  ui: GoogleAppsScript.Base.Ui,
  accountSheetNames: string[]
): void {
  const startTime = FastLog.start(buildAccountsMenu.name);
  // Check if any accounts are found
  if (accountSheetNames.length === 0) {
    ui.alert("No account sheets found!");
    FastLog.finish(buildAccountsMenu.name, startTime);
    return;
  }

  const itemArray: [string, string][] = [];

  for (const accountSheetName of accountSheetNames) {
    const funName = "dynamicAccount" + accountSheetName;
    itemArray.push([accountSheetName, funName]);
  }

  createMenu(ui, "Accounts", itemArray);
  FastLog.finish(buildAccountsMenu.name, startTime);
}
