import {
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
} from "./constants";

export function buildAccountsMenu_(
  ui: GoogleAppsScript.Base.Ui,
  accountSheetNames: string[]
): void {
  // Check if any accounts are found
  if (accountSheetNames.length === 0) {
    ui.alert("No account sheets found!");
    return;
  }

  const itemArray: [string, string][] = [];

  for (const accountSheetName of accountSheetNames) {
    const funName = "dynamicAccount" + accountSheetName;
    itemArray.push([accountSheetName, funName]);
  }

  createMenu(ui, "Accounts", itemArray);
}

export function buildGasMenu_(ui: GoogleAppsScript.Base.Ui) {
  const itemArray: [string, string][] = [
    ["All accounts", "showAllAccounts"],
    ["Apply Description replacements", "applyDescriptionReplacements"],
    ["Balance sheet", "balanceSheet"],
    ["Check dependencies", "checkDependencies"],
    ["Convert current column to uppercase", "convertCurrentColumnToUppercase"],
    ["Daily update", "dailyUpdate"],
    ["Format sheet", "formatSheet"],
    ["Monthly update", "monthlyUpdate"],
    ["Open accounts", "openAccounts"],
    ["Sort sheet order", "sortSheets"],
    ["Trim all sheets", "trimAllSheets"],
    ["Trim sheet", "trimSheet"],
    ["Update spreadsheet summary", "updateSpreadsheetSummary"],
    ["Validate all menu function names", "validateAllMenuFunctionNames"],
  ];
  createMenu(ui, "GAS Menu", itemArray);
}

export function buildSectionsMenu_(ui: GoogleAppsScript.Base.Ui) {
  ui.createMenu("Sections")
    .addSubMenu(
      ui
        .createMenu("Accounts")
        .addItem("Update 'Transactions'", "updateTransactions")
        .addItem("Update 'Accounts data'", "updateAccountsData")
        .addItem(
          "Not in transaction categories",
          "goToSheetNotInTransactionCategories"
        )
        .addItem("Uncategorised by date", "goToSheetUncategorisedByDate")
        .addItem("Category clash", "goToSheetCategoryClash")
        .addItem("Categories", "goToSheetCategories")
        .addItem("Transactions by date", "goToSheetTransactionsByDate")
        .addItem("Transaction categories", "goToSheetTransactionCategories")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Budget")
        .addItem("Budget", "budget")
        .addItem(
          MetaBudgetAnnualTransactions.SHEET.NAME,
          "budgetAnnualTransactions"
        )
        .addItem("Budget monthly transactions", "budgetMonthlyTransactions")
        .addItem(
          MetaBudgetAdHocTransactions.SHEET.NAME,
          "budgetAdHocTransactions"
        )
        .addItem("Budget predicted spend", "budgetPredictedSpend")
        .addItem("Budget weekly transactions", "budgetWeeklyTransactions")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Charlie")
        .addItem("Charlie's transactions", "goToSheet_CVITRA")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Fownes Street")
        .addItem("Fownes Street Halifax account", "goToSheet_AHALIF")
        .addItem("Fownes Street Ian B HMRC records", "goToSheet_SVI2TJ")
        .addItem("Fownes Street IRF transactions", "goToSheet_SVIIRF")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Glenburnie")
        .addItem("Glenburnie investment loan", "goToSheet_SVIGBL")
        .addItem("Glenburnie loan", "goToSheetLoanGlenburnie")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("HMRC")
        .addItem(
          "HMRC Transactions summary",
          "goToSheetHMRCTransactionsSummary"
        )
        .addItem("Self Assessment Ian Bernard", "goToSheetHMRC_B")
        .addItem("Self Assessment Ian Sweeney", "goToSheetHMRC_S")
        .addItem("SES Childcare", "goToSheetHMRCTransactionsSummary")
        .addItem("SES Property management", "goToSheetHMRCTransactionsSummary")
        .addItem("TR People", "goToSheetPeople")
        .addItem("UKP Fownes Street", "goToSheetHMRCTransactionsSummary")
        .addItem("UKP One Park West", "goToSheetHMRCTransactionsSummary")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("SW18 3PT")
        .addItem("Home Assistant inventory", "goToSheetSW183PTInventory")
        .addItem("Inventory", "goToSheetSW183PTInventory")
    )
    .addSeparator()
    .addItem("Xfers mismatch", "goToSheetXfersMismatch")
    .addToUi();
}

function createMenu(
  ui: GoogleAppsScript.Base.Ui,
  menuCaption: string,
  menuItemArray: [string, string][]
) {
  const menu = ui.createMenu(menuCaption);

  menuItemArray.forEach(([itemName, itemFunction]) => {
    menu.addItem(itemName, itemFunction);
  });

  menu.addToUi();
}
