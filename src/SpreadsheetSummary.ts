/// <reference types="google-apps-script" />

import type { Sheet } from "./Sheet";
import type { Spreadsheet } from "./Spreadsheet";
import type { SpreadsheetSummaryRow } from "./interfaces";

export class SpreadsheetSummary {
  private sheet: Sheet;
  private spreadsheet: Spreadsheet;
  private dataRows: any[][];
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

  constructor(spreadsheet: Spreadsheet) {
    this.spreadsheet = spreadsheet;
    this.sheet = spreadsheet.getSheet(SpreadsheetSummary.SHEET.NAME);
    this.dataRows = this.sheet.getDataRange().offset(1, 0).getValues();
  }

  get accountSheetNames() {
    return this.allSheetNames.filter((name: string) => name.startsWith("_"));
  }

  get allSheetNames() {
    return this.dataRows.map(
      (row) => row[SpreadsheetSummary.COLUMNS.SHEET_NAME]
    );
  }

  get budgetSheetNames() {
    return this.dataRows
      .filter((row) => row[SpreadsheetSummary.COLUMNS.IS_BUDGET])
      .map((row) => row[SpreadsheetSummary.COLUMNS.SHEET_NAME]);
  }

  get name(): string {
    return this.sheet.name;
  }

  update(): void {
    const data: SpreadsheetSummaryRow[] = this.spreadsheet.sheets.map(
      (sheet) => {
        const raw = sheet.raw;

        // Single scan for both lastRow + lastColumn
        const range = raw.getDataRange();
        const lastRow = range.getLastRow();
        const lastColumn = range.getLastColumn();
        const sheetName = sheet.getSheetName();

        return {
          sheetName: sheetName,
          lastRow,
          lastColumn,
          maxRows: raw.getMaxRows(), // cheap metadata
          maxColumns: raw.getMaxColumns(), // cheap metadata
          isAccount: sheetName.startsWith("_"),
          isBudget: sheetName.startsWith("Budget"),
        };
      }
    );

    // Add header row
    const header: (keyof SpreadsheetSummaryRow)[] = [
      "sheetName",
      "lastRow",
      "lastColumn",
      "maxRows",
      "maxColumns",
      "isAccount",
      "isBudget",
    ];

    const headerRow: string[] = [
      "Sheet name",
      "Last row",
      "Last column",
      "Max rows",
      "Max columns",
      "Is an account file (starts with underscore)?",
      "Is a budget file (starts with Budget)?",
    ];

    // Combine header + data
    const rows: (string | number | boolean)[][] = [
      headerRow,
      ...data.map((row) => header.map((key) => row[key])),
    ];

    this.sheet.clearContents();
    this.sheet.raw.getRange(1, 1, rows.length, header.length).setValues(rows);
  }
}
