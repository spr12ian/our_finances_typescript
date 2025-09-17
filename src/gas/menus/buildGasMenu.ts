import { FastLog } from "@logging";
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
  const menu = createMenu(ui, "GAS Menu", itemArray)
    .addSeparator()
    .addSubMenu(ui.createMenu("Sheet").addItem("Trim sheet", "trimSheet"));
  menu.addToUi();
  FastLog.finish(buildGasMenu.name, startTime);
}
