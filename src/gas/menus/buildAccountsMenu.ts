import { FastLog, withLog } from "@logging";
import { getAccountSheetNames } from "../../features/sheets/accountSheetFunctions";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
// import { registerGeneratedAccountFunctions } from "../../registerGeneratedAccountFunctions";
import { createMenu } from "./createMenu";

export function buildAccountsMenu(
  ui: GoogleAppsScript.Base.Ui,
  e: GoogleAppsScript.Events.SheetsOnOpen
): void {
  const fn = buildAccountsMenu.name;
  FastLog.info(fn, "Called");

  const spreadsheet = withLog(getFinancesSpreadsheet)(e);
  const accountSheetNames: string[] =
    withLog(getAccountSheetNames)(spreadsheet);

  // Check if any accounts are found
  if (accountSheetNames.length === 0) {
    ui.alert("No account sheets found!");
    return;
  }

  const accountsMenuItems: [string, string][] = [];

  for (const accountSheetName of accountSheetNames) {
    const funName = "goToSheetLastRow" + accountSheetName;
    accountsMenuItems.push([accountSheetName, funName]);
  }

  const accountsMenu = createMenu(ui, "Accounts", accountsMenuItems);
  accountsMenu.addToUi();
}
