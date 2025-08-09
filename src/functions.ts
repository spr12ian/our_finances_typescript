/// <reference types="google-apps-script" />

import { OurFinances } from "./OurFinances";
import { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";

// Function declarations

function cloneDate(date) {
  return new Date(date.getTime());
}

function dailyUpdate() {
  const bankAccounts = new BankAccounts();
  bankAccounts.showDaily();
}

export function dynamicQuery(rangeString, queryString) {
  try {
    // Import QUERY function from DataTable
    const dataTable = Charts.newDataTable()
      .addColumn("Column", "string")
      .build();

    rangeString = rangeString.trim();
    queryString = queryString.trim();

    const result = dataTable.applyQuery(rangeString + "," + queryString);
    return result.toArray();
  } catch (error) {
    console.error("Error in dynamicQuery:", error);
    throw error;
  }
}

function emailUpcomingPayments() {
  const ourFinances = new OurFinances();
  ourFinances.emailUpcomingPayments();
}

export function examineObject(object, name = "anonymous value") {
  if (typeof object === "object" && object !== null) {
    const keys = Object.keys(object);

    const ownPropertyNames = Object.getOwnPropertyNames(object);

    // Get own properties
    const ownDescriptors = Object.getOwnPropertyDescriptors(object);

    // Get prototype properties (including greet)
    const prototypeDescriptors = Object.getOwnPropertyDescriptors(
      Object.getPrototypeOf(object)
    );
  }
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

export function findUsageByNamedRange(namedRange:string) {
  const sheets = Spreadsheet.getActive().sheets;
  const rangeUsage = [];

  sheets.forEach((sheet) => {
    const formulas = sheet.raw.getDataRange().getFormulas();

    formulas.forEach((rowFormulas, rowIndex) => {
      rowFormulas.forEach((formula, colIndex: number) => {
        if (formula.includes(namedRange)) {
          const cellRef = sheet.raw
            .getRange(rowIndex + 1, colIndex + 1)
            .getA1Notation();
          rangeUsage.push(`Sheet: ${sheet.name} - Cell: ${cellRef}`);
        }
      });
    });
  });
}

export function getLastUpdatedColumn(sheet: Sheet) {
  const lastUpdated = "Last Updated";
  let lastUpdatedColumn;
  const firstRowRange = sheet.firstRowRange;
  const values = firstRowRange.getValues();
  for (let row in values) {
    for (let col in values[row]) {
      const cell = values[row][col];

      const newCell = cell.replace(/\n/g, " ");

      if (newCell == lastUpdated) {
        const lastUpdatedColumnNbr = 1 + parseInt(col, 10);
        const lastUpdatedCell = firstRowRange.getCell(1, lastUpdatedColumnNbr);
        const lastUpdatedColumnA1 = lastUpdatedCell.getA1Notation();
        lastUpdatedColumn = lastUpdatedColumnA1.replace(/[0-9]/g, "");
        break;
      }
    }
  }

  return lastUpdatedColumn;
}

export function getLineNumber(): string {
  try {
    throw new Error();
  } catch (e: unknown) {
    if (e instanceof Error && e.stack) {
      // Extract line number from the stack trace
      const stack = e.stack.split("\n");
      const line = stack[2]?.match(/:(\d+):\d+\)?$/);
      return line ? line[1] : "unknown";
    }
    return "unknown";
  }
}

export function goToSheetLastRow(sheetName: string) {
  const spreadsheet = Spreadsheet.getActive();
  const sheet = spreadsheet.getSheet(sheetName);
  sheet.setActiveRange(sheet.raw.getRange(sheet.raw.getLastRow(), 1));
}

export function isCellAccountBalance(sheet: Sheet, column: number) {
  const accountBalance = "Account Balance";

  let isCellAccountBalance = false;

  const firstRowRange = sheet.firstRowRange;

  const values = firstRowRange.getValues();
  for (const row in values) {
    const cell = values[row][column - 1];

    const newCell = cell.replace(/\n/g, " ");

    if (newCell == accountBalance) {
      isCellAccountBalance = true;
      break;
    }
  }

  return isCellAccountBalance;
}

export function isCellADate(cell: GoogleAppsScript.Spreadsheet.Range) {
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
export function isSingleCell(range: GoogleAppsScript.Spreadsheet.Range) {
  if (
    !range ||
    typeof range.getNumColumns !== "function" ||
    typeof range.getNumRows !== "function"
  ) {
    throw new Error("Invalid input: Expected a Range object.");
  }

  return range.getNumColumns() === 1 && range.getNumRows() === 1;
}

export function openAccounts() {
  const ourFinances = new OurFinances();
  ourFinances.bankAccounts.showOpenAccounts();
}

export function setLastUpdatedOnAccountBalanceChange(sheet: Sheet) {
  if (sheet.isAccountSheet()) {
    const key = sheet.getSheetName().slice(1);
    const bankAccounts = new OurFinances().bankAccounts;

    bankAccounts.updateLastUpdatedByKey(key);
  }
}

export function toValidFunctionName(str: string) {
  // Remove non-alphanumeric characters, except for letters and digits, replace them with underscores
  let validName = str.trim().replace(/[^a-zA-Z0-9]/g, "_");

  // Ensure the name starts with a letter or underscore
  return /^[a-zA-Z_]/.test(validName) ? validName : `_${validName}`;
}
