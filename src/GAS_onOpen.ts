/// <reference types="google-apps-script" />

import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { getSheetNamesByType } from "./functions";
import { logTiming } from "./logTiming";
import { OurFinances } from "./OurFinances";
import type { Sheet } from "./Sheet";
import { createSheet } from "./SheetFactory";
import { SpreadsheetSummary } from "./SpreadsheetSummary";

// Function declarations

const logTiming = <T>(label: string, fn: () => T): T => {
  const t0 = Date.now();
  const result = fn();
  console.log(`${label}: ${Date.now() - t0}ms`);
  return result;
};

export function balanceSheet() {
  goToSheet("Balance sheet");
}

export function budgetAnnualTransactions() {
  goToSheet(BudgetAnnualTransactions.SHEET.NAME);
}

export function budgetMonthlyTransactions() {
  goToSheet("Budget monthly transactions");
}

export function budgetAdhocTransactions() {
  goToSheet("Budget ad hoc transactions");
}

export function budgetPredictedSpend() {
  goToSheet("Budget predicted spend");
}

export function budgetWeeklyTransactions() {
  goToSheet("Budget weekly transactions");
}

export function checkDependencies() {
  const dependencies = new Dependencies();
  dependencies.updateAllDependencies();
}

export function convertCurrentColumnToUppercase() {
  const sheet = gasSpreadsheetApp.getActiveSheet();
  const activeRange = sheet.getActiveRange();
  const START_ROW = 2;
  const column = activeRange.getColumn();

  const lastRow = sheet.getLastRow();
  const numRows = lastRow + 1 - START_ROW;

  const range = sheet.getRange(START_ROW, column, numRows, 1);
  const values = range.getValues();
  const uppercasedValues = values.map((row) => [
    row[0].toString().toUpperCase(),
  ]);

  range.setValues(uppercasedValues);
}

function buildAccountsMenu_(
  ui: GoogleAppsScript.Base.Ui,
  accountSheetNames: string[]
): void {
  // accountSheetNames is defined as a global
  //const accountSheetNames = getSheetNamesByType('account');

  // Check if any accounts are found
  if (accountSheetNames.length === 0) {
    ui.alert("No account sheets found!");
    return;
  }

  const itemArray = [];

  for (const accountSheetName of accountSheetNames) {
    const funName = "dynamicAccount" + accountSheetName;
    itemArray.push([accountSheetName, funName]);
  }

  createMenu(ui, "Accounts", itemArray);
}

function buildGasMenu_(ui: GoogleAppsScript.Base.Ui) {
  const itemArray = [
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
    ["Trim all sheets", "trimGoogleSheets"],
    ["Trim sheet", "trimGoogleSheet"],
    ["Update spreadsheet summary", "updateSpreadsheetSummary"],
  ];
  createMenu(ui, "GAS Menu", itemArray);
}

function buildSectionsMenu_(ui: GoogleAppsScript.Base.Ui) {
  const menu = ui
    .createMenu("Sections")
    .addSubMenu(
      ui
        .createMenu("Budget")
        .addItem("Budget", "budget")
        .addItem(
          BudgetAnnualTransactions.SHEET.NAME,
          "budgetAnnualTransactions"
        )
        .addItem("Budget monthly transactions", "budgetMonthlyTransactions")
        .addItem("Budget ad hoc transactions", "budgetAdhocTransactions")
        .addItem("Budget predicted spend", "budgetPredictedSpend")
        .addItem("Budget weekly transactions", "budgetWeeklyTransactions")
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu("Categories")
        .addItem("4 All transactions by date", "goToSheetTransactionsByDate")
        .addItem("5 Assign categories", "goToSheetTransactionsCategories")
        .addItem("1 Categories", "goToSheetCategories")
        .addItem("Category clash", "goToSheetCategoryClash")
        .addItem("7 Merge transactions", "mergeTransactions")
        .addItem("8 Copy keys", "copyKeys")
        .addItem(
          "2 Not in transaction categories",
          "goToSheetNotInTransactionCategories"
        )
        .addItem("6 Transactions builder", "goToSheetTransactionsBuilder")
        .addItem("3 Uncategorised by date", "goToSheetUnlabelledByDate")
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
  menuItemArray
) {
  const menu = ui.createMenu(menuCaption);

  menuItemArray.forEach(([itemName, itemFunction]) => {
    menu.addItem(itemName, itemFunction);
  });

  menu.addToUi();
}

function dailyUpdate() {
  const bankAccounts = new BankAccounts();
  bankAccounts.showDaily();
}

function emailUpcomingPayments() {
  const ourFinances = new OurFinances();
  ourFinances.emailUpcomingPayments();
}

function findAllNamedRangeUsage() {
  const sheets = activeSpreadsheet.getSheets();
  const namedRanges = activeSpreadsheet.getNamedRanges();
  const rangeUsage = [];

  if (!namedRanges.length) {
    return;
  }

  // Extract the named range names
  const namedRangeNames = namedRanges.map((range) => range.getName());

  sheets.forEach((sheet) => {
    const formulas = sheet.getDataRange().getFormulas();

    formulas.forEach((rowFormulas, rowIndex) => {
      rowFormulas.forEach((formula, colIndex) => {
        // Only track cells containing named ranges
        if (formula) {
          namedRangeNames.forEach((name) => {
            if (formula.includes(name)) {
              const cellRef = sheet
                .getRange(rowIndex + 1, colIndex)
                .getA1Notation();
              rangeUsage.push(
                `Sheet: ${sheet.getName()} - Cell: ${cellRef} - Name: ${name}`
              );
            }
          });
        }
      });
    });
  });
}

function findNamedRangeUsage() {
  findUsageByNamedRange("BRIAN_HALIFAX_BALANCE");
}

export function formatSheet() {
  const activeSheet = activeSpreadsheet.getActiveSheet();

  if (!activeSheet) {
    return;
  }

  const accountSheet = new AccountSheet(activeSheet);
  accountSheet.formatSheet();
}

function getAccountSheetNames(): string[] {
  // Generated via Python
  return [
    "_AHALIF",
    "_ASANTA",
    "_BCHASE",
    "_BCHRND",
    "_BCHSAV",
    "_BCOISA",
    "_BCOLOY",
    "_BCYNER",
    "_BFAMIL",
    "_BGOLDM",
    "_BHASAV",
    "_BHAULT",
    "_BMETRO",
    "_BMOCHA",
    "_BMOFWN",
    "_BMOKID",
    "_BMONZO",
    "_BMOPAR",
    "_BMOSAV",
    "_BNSPBZ",
    "_BOAISA",
    "_BOAKNO",
    "_BOXBUR",
    "_BPAYPA",
    "_BPOSTO",
    "_BSAISA",
    "_BSANTA",
    "_BSASA2",
    "_BSASA3",
    "_BSASAV",
    "_BSATAX",
    "_BTES01",
    "_BTESCO",
    "_BTRISA",
    "_BVANGA",
    "_BVMISA",
    "_BVMSAV",
    "_BWALLE",
    "_CLLOYD",
    "_CMETRO",
    "_CVITRA",
    "_JFIXES",
    "_JSANTA",
    "_JWALEU",
    "_SAMAZO",
    "_SCHASE",
    "_SCHBST",
    "_SCHRND",
    "_SCHSAV",
    "_SCOIS2",
    "_SCOISA",
    "_SCOLOY",
    "_SFAMIL",
    "_SGOLDM",
    "_SJL3BH",
    "_SKI3BH",
    "_SKROOO",
    "_SMETRO",
    "_SMONZ1",
    "_SMONZO",
    "_SNSPBZ",
    "_SOAISA",
    "_SOAKNO",
    "_SOXBUR",
    "_SPAYPA",
    "_SPOSTO",
    "_SREVOL",
    "_SSACR1",
    "_SSACRD",
    "_SSAISA",
    "_SSANT1",
    "_SSANTA",
    "_SSAPRM",
    "_SSAZ01",
    "_SSAZ02",
    "_SSAZ03",
    "_SSTARB",
    "_SSTARL",
    "_STAFIX",
    "_STASAV",
    "_STES01",
    "_STES02",
    "_STES03",
    "_STESCO",
    "_STRISA",
    "_SVANGA",
    "_SVI2TJ",
    "_SVI3BH",
    "_SVIGB2",
    "_SVIGBL",
    "_SVIIRF",
    "_SVMISA",
    "_SVMSAV",
    "_SWALLE",
    "_SZOPA1",
  ];
}

export function getHMRCTotalByYear(category, year) {
  return category + "-" + year;
}

function getLineNumber() {
  try {
    throw new Error();
  } catch (e) {
    // Extract line number from the stack trace
    const stack = e.stack.split("\n");
    const line = stack[2].match(/:(\d+):\d+\)?$/);
    return line ? line[1] : "unknown";
  }
}

function goToSheet(sheetName: string) {
  const sheet = createSheet(sheetName);

  // Check if the sheet exists before trying to activate it.
  if (sheet) {
    sheet.activate();
  }
}

function goToSheet_AHALIF() {
  goToSheet("_AHALIF");
}

function goToSheet_CVITRA() {
  goToSheet("_CVITRA");
}

function goToSheet_SVI2TJ() {
  goToSheet("_SVI2TJ");
}

function goToSheet_SVIGBL() {
  goToSheet("_SVIGBL");
}

function goToSheet_SVIIRF() {
  goToSheet("_SVIIRF");
}

function goToSheetCategories() {
  goToSheet("Categories");
}

function goToSheetCategoryClash() {
  goToSheet("Category clash");
}

function goToSheetHMRC_B() {
  goToSheet(HMRC_B.SHEET_NAME);
}

function goToSheetHMRC_S() {
  goToSheet(HMRC_S.SHEET.NAME);
}

function goToSheetHMRCTransactionsSummary() {
  goToSheet("HMRC Transactions Summary");
}

function goToSheetLoanGlenburnie() {
  goToSheet("Loan Glenburnie");
}

function goToSheetNotInTransactionCategories() {
  goToSheet("Not in transaction categories");
}

function goToSheetPeople() {
  goToSheet("People");
}

function goToSheetSW183PTInventory() {
  goToSheet("SW18 3PT inventory");
}

function goToSheetTransactionsBuilder() {
  goToSheet("Transactions builder");
}

function goToSheetTransactionsByDate() {
  goToSheet("Transactions by date");
}

function goToSheetTransactionsCategories() {
  goToSheet("Transactions categories");
}

function goToSheetUnlabelledByDate() {
  goToSheet("Uncategorised by date");
}

function goToSheetXfersMismatch() {
  goToSheet("Xfers mismatch");
}

function isAccountSheet(sheet) {
  if (sheet.getSheetName().startsWith("_")) return true;
  return false;
}

function isCellAccountBalance(sheet: Sheet, column) {
  const accountBalance = "Account Balance";

  let isCellAccountBalance = false;

  const firstRowRange = sheet.firstRowRange();

  const values = firstRowRange.getValues();
  for (const row in values) {
    const cell = values[row][column - 1];

    newCell = cell.replace(/\n/g, " ");

    if (newCell == accountBalance) {
      isCellAccountBalance = true;
      break;
    }
  }

  return isCellAccountBalance;
}

function isCellADate(cell) {
  // Get the value of the specified cell
  const cellValue = cell.getValue();

  // Check if the value is a Date object
  if (
    Object.prototype.toString.call(cellValue) === "[object Date]" &&
    !isNaN(cellValue.getTime())
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * Checks if the given range represents a single cell.
 *
 * @param {Range} range - The range to check.
 * @returns {boolean} - Returns true if the range contains only one cell, otherwise false.
 */
function isSingleCell(range) {
  if (
    !range ||
    typeof range.getNumColumns !== "function" ||
    typeof range.getNumRows !== "function"
  ) {
    throw new Error("Invalid input: Expected a Range object.");
  }

  return range.getNumColumns() === 1 && range.getNumRows() === 1;
}

function mergeTransactions() {
  const transactions = new Transactions();
  const transactionsBuilder = new TransactionsBuilder();
  transactionsBuilder.copyIfSheetExists();
  const transactionFormulas = transactionsBuilder.getTransactionFormulas();

  transactions.updateBuilderFormulas(transactionFormulas);

  transactions.activate();
}

export function GAS_onOpen(): void {
  try {
    const ui = SpreadsheetApp.getUi();

    const accountSheetNames = getSheetNamesByType("account"); // now safe
    logTiming("Accounts menu", () => buildAccountsMenu_(ui, accountSheetNames));
    logTiming("GAS menu", () => buildGasMenu_(ui));
    logTiming("Sections menu", () => buildSectionsMenu_(ui));
  } catch (err) {
    console.error("onOpen error:", err);
  }
}

function openAccounts() {
  const ourFinances = new OurFinances();
  ourFinances.bankAccounts.showOpenAccounts();
}

function toValidFunctionName(str) {
  // Remove non-alphanumeric characters, except for letters and digits, replace them with underscores
  let validName = str.trim().replace(/[^a-zA-Z0-9]/g, "_");

  // Ensure the name starts with a letter or underscore
  return /^[a-zA-Z_]/.test(validName) ? validName : `_${validName}`;
}

function trimGoogleSheet(iswSheet) {
  let sheet;
  if (iswSheet) {
    sheet = iswSheet;
  } else {
    sheet = activeSpreadsheet.getActiveSheet();
  }

  sheet.trimSheet();
}

function trimGoogleSheets() {
  const sheets = activeSpreadsheet.getSheets();
  sheets.forEach((sheet) => {
    sheet.trimSheet();
  });
}

function updateSpreadsheetSummary() {
  const spreadsheetSummary = new SpreadsheetSummary();
  const sheets = activeSpreadsheet.getSheets();
  const sheetData = sheets.map((sheet) => [
    sheet.getSheetName(),
    sheet.getLastRow(),
    sheet.getLastColumn(),
    sheet.getMaxRows(),
    sheet.getMaxColumns(),
    sheet.getSheetName().startsWith("_"),
    sheet.getSheetName().startsWith("Budget"),
  ]);

  // Add headers
  sheetData.unshift([
    "Sheet name",
    "Last row",
    "Last column",
    "Max rows",
    "Max columns",
    "Is an account file (starts with underscore)?",
    "Is a budget file (starts with Budget)?",
  ]);

  const maxWidth = sheetData[0].length;

  // Minimize calls to Google Sheets API by using clearContent instead of clear() if possible.
  const summarySheet = spreadsheetSummary.getSheet();
  summarySheet.clearContents();
  summarySheet.getRange(1, 1, sheetData.length, maxWidth).setValues(sheetData);

  trimGoogleSheet(summarySheet);
}
