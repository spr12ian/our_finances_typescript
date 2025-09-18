import { FastLog } from "@logging";
import { getAccountSheetNames } from "../../accountSheetFunctions";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { registerDynamicAccountFunctions } from "../../registerDynamicAccountFunctions";
import { createMenu } from "./createMenu";

export function buildAccountsMenu(ui: GoogleAppsScript.Base.Ui): void {
  const startTime = FastLog.start(buildAccountsMenu.name);

  const spreadsheet = getFinancesSpreadsheet();
  const accountSheetNames: string[] = getAccountSheetNames(spreadsheet);

  // Check if any accounts are found
  if (accountSheetNames.length === 0) {
    ui.alert("No account sheets found!");
    FastLog.finish(buildAccountsMenu.name, startTime);
    return;
  }

  const accountsMenuItems: [string, string][] = [];

  for (const accountSheetName of accountSheetNames) {
    const funName = "dynamicAccount" + accountSheetName;
    accountsMenuItems.push([accountSheetName, funName]);
  }

  const accountsMenu = createMenu(ui, "Accounts", accountsMenuItems);
  accountsMenu.addToUi();

  registerDynamicAccountFunctions(accountSheetNames);

  FastLog.finish(buildAccountsMenu.name, startTime);
}
