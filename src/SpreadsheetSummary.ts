/// <reference types="google-apps-script" />

import { Sheet } from "./Sheet";

export class SpreadsheetSummary {
  private sheet: Sheet;
  static get COLUMNS() {
    return {
      SHEET_NAME: 0,
      LAST_ROW: 1,
      LAST_COL: 2,
      MAX_ROWS: 3,
      MAX_COLS: 4,
      IS_ACCOUNT: 5,
      IS_BUDGET: 6,
    };
  }

  static get SHEET() {
    return {
      NAME: "Spreadsheet summary",
    };
  }

  constructor() {
    this.sheet = Sheet.from(SpreadsheetSummary.SHEET.NAME);
    this.data = this.sheet.getDataRange().offset(1, 0).getValues();
  }

  getBudgetSheetNames() {
    return this.data
      .filter((row) => row[SpreadsheetSummary.COLUMNS.IS_BUDGET])
      .map((row) => row[SpreadsheetSummary.COLUMNS.SHEET_NAME]);
  }

  getSheetNames() {
    return this.data.map((row) => row[SpreadsheetSummary.COLUMNS.SHEET_NAME]);
  }

  update() {
    const sheetData = activeSpreadsheet.getSheets().map((iswSheet) => ({
      sheetName: iswSheet.getSheetName(),
      lastRow: iswSheet.getLastRow(),
      lastColumn: iswSheet.getLastColumn(),
      maxRows: iswSheet.getMaxRows(),
      maxColumns: iswSheet.getMaxColumns(),
      isAccount: iswSheet.getSheetName().startsWith("_"),
      isBudget: iswSheet.getSheetName().startsWith("Budget"),
    }));

    sheetData.unshift({
      sheetName: "Sheet name",
      lastRow: "Last row",
      lastColumn: "Last column",
      maxRows: "Max rows",
      maxColumns: "Max columns",
      isAccount: "Is an account file (starts with underscore)?",
      isBudget: "Is a budget file (starts with Budget)?",
    });

    const sheetArray = sheetData.map((sheet) => [
      sheet.sheetName,
      sheet.lastRow,
      sheet.lastColumn,
      sheet.maxRows,
      sheet.maxColumns,
      sheet.isAccount,
      sheet.isBudget,
    ]);

    const maxWidth = sheetArray[0].length;

    // Minimize calls to Google Sheets API by using clearContent instead of clear() if possible.
    this.sheet.clearContents();
    this.sheet
      .getRange(1, 1, sheetArray.length, maxWidth)
      .setValues(sheetArray);
  }

  getSheet() {
    return this.sheet;
  }

  getSheetName() {
    return this.sheet.getSheetName();
  }
}
