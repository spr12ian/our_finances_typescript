import { FastLog } from "@lib/logging/FastLog";
import { createMenu } from "./createMenu";

export function buildGasMenu(ui: GoogleAppsScript.Base.Ui) {
  const startTime = FastLog.start(buildGasMenu.name);
  const itemArray: [string, string][] = [
    ["All accounts", "showAllAccounts"],
    ["Apply Description replacements", "applyDescriptionReplacements"],
    ["Balance sheet", "balanceSheet"],
    ["Check dependencies", "updateAllDependencies"],
    ["Convert current column to uppercase", "convertCurrentColumnToUppercase"],
    ["Daily update", "dailyUpdate"],
    ["Fix sheet", "fixSheet"],
    ["Monthly update", "monthlyUpdate"],
    ["Open accounts", "openAccounts"],
    ["Sort sheet order", "sortSheets"],
    ["Trim all sheets", "trimAllSheets"],
    ["Update spreadsheet summary", "updateSpreadsheetSummary"],
    ["Validate all menu function names", "validateAllMenuFunctionNames"],
  ];
  createMenu(ui, "GAS Menu", itemArray);
  FastLog.finish(buildGasMenu.name, startTime);
}
