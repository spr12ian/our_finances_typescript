import { FastLog } from "@logging";
import { getAccountSheetNames } from "../../features/sheets/accountSheetFunctions";
import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
// import { registerGeneratedAccountFunctions } from "../../registerGeneratedAccountFunctions";
import { createMenu } from "./createMenu";

export function buildAccountsMenu(ui: GoogleAppsScript.Base.Ui): void {
  const fn = buildAccountsMenu.name;
  const startTime = FastLog.start(fn);

  try {
    const spreadsheet = getFinancesSpreadsheet();
    const accountSheetNames: string[] = getAccountSheetNames(spreadsheet);

    // Check if any accounts are found
    if (accountSheetNames.length === 0) {
      ui.alert("No account sheets found!");
      FastLog.finish(fn, startTime);
      return;
    }

    const accountsMenuItems: [string, string][] = [];

    for (const accountSheetName of accountSheetNames) {
      const funName = "goToSheetLastRow" + accountSheetName;
      accountsMenuItems.push([accountSheetName, funName]);
    }

    const accountsMenu = createMenu(ui, "Accounts", accountsMenuItems);
    accountsMenu.addToUi();

    // registerGeneratedAccountFunctions(accountSheetNames);
  } finally {
    FastLog.finish(fn, startTime);
  }
}
