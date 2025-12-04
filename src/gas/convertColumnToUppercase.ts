// convertColumnToUppercase.ts

import { FastLog } from "@lib/logging";

export function convertColumnToUppercase(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  column: number,
  startRow: number = 2
): void {
  const fn=convertColumnToUppercase.name;

  if (column < 1) {
    throw new Error(`${fn}: Invalid column: ${column}. Must be 1 or greater.`);
  }
  
  if (startRow < 2) {
    throw new Error(`${fn}: Invalid startRow: ${startRow}. Must be 2 or greater.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < startRow) {
    FastLog.log(`${fn}: No data to transform. lastRow: ${lastRow} < startRow: ${startRow}`);
    return;
  }

  const numRows = lastRow - startRow + 1;
  const range = sheet.getRange(startRow, column, numRows, 1);
  const values = range.getValues();

  const updated = values.map(([value]) => {
    if (typeof value === "string") {
      return [value.toUpperCase()];
    }
    if (value == null) {
      return [""];
    }
    return [value]; // leave numbers/dates/booleans untouched
  });

  range.setValues(updated);
}
