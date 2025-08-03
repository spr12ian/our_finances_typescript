/// <reference types="google-apps-script" />

import type { Sheet } from "./Sheet";
import type { Spreadsheet } from "./Spreadsheet";
import type { SpreadsheetSummaryRow } from "./interfaces";

export class SpreadsheetSummary {
  private sheet: Sheet;
  private spreadsheet: Spreadsheet;
  private data: any[][];
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
    this.data = this.sheet.getDataRange().offset(1, 0).getValues();
  }

  get accountSheetNames() {
    return this.allSheetNames.filter((name: string) => name.startsWith("_"));
  }

  get allSheetNames() {
    return this.data.map((row) => row[SpreadsheetSummary.COLUMNS.SHEET_NAME]);
  }

  get budgetSheetNames() {
    return this.data
      .filter((row) => row[SpreadsheetSummary.COLUMNS.IS_BUDGET])
      .map((row) => row[SpreadsheetSummary.COLUMNS.SHEET_NAME]);
  }

  get name(): string {
    return this.sheet.name;
  }

  update(): void {
    const data: SpreadsheetSummaryRow[] = this.spreadsheet.sheets.map(
      (sheet) => ({
        sheetName: sheet.getSheetName(),
        lastRow: sheet.raw.getLastRow(),
        lastColumn: sheet.raw.getLastColumn(),
        maxRows: sheet.raw.getMaxRows(),
        maxColumns: sheet.raw.getMaxColumns(),
        isAccount: sheet.getSheetName().startsWith("_"),
        isBudget: sheet.getSheetName().startsWith("Budget"),
      })
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
