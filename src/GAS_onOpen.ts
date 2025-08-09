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

export function getHMRCTotalByYear(category, year) {
  return category + "-" + year;
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
