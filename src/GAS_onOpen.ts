/// <reference types="google-apps-script" />
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { OurFinances } from "./OurFinances";
import type { Sheet } from "./Sheet";
import { SpreadsheetSummary } from "./SpreadsheetSummary";

// Function declarations

export function balanceSheet() {
  goToSheet("Balance sheet");
}

export function budgetAnnualTransactions() {
  goToSheet(BudgetAnnualTransactions.SHEET.NAME);
}

export function budgetMonthlyTransactions() {
  goToSheet("Budget monthly transactions");
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

function goToSheetPeople() {
  goToSheet("People");
}

function goToSheetSW183PTInventory() {
  goToSheet("SW18 3PT inventory");
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

  trimSheet(summarySheet);
}
