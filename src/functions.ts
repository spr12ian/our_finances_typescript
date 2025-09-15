/// <reference types="google-apps-script" />

import { isAccountSheet } from "./accountSheetFunctions";
import { Sheet } from "./domain/Sheet";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { OurFinances } from "./OurFinances";

// Function declarations

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

export function setLastUpdatedOnAccountBalanceChange(sheet: Sheet) {
  if (isAccountSheet(sheet)) {
    const key = sheet.getSheetName().slice(1);
    const spreadsheet = getFinancesSpreadsheet();
    const bankAccounts = new OurFinances(spreadsheet).bankAccounts;

    bankAccounts.updateLastUpdatedByKey(key);
  }
}

export function toValidFunctionName(str: string): string {
  // Remove non-alphanumeric characters, except for letters and digits, replace them with underscores
  let validName = str.trim().replace(/[^a-zA-Z0-9]/g, "_");

  // Ensure the name starts with a letter or underscore
  return /^[a-zA-Z_]/.test(validName) ? validName : `_${validName}`;
}
