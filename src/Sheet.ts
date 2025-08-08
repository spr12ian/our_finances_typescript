/// <reference types="google-apps-script" />
import { isAccountSheetName } from "./isAccountSheetName";
/**
 * Thin wrapper around a GAS Sheet.
 * Prefer using `createSheet(...)` to instantiate.
 */
export class Sheet {
  private readonly gasSheet: GoogleAppsScript.Spreadsheet.Sheet;
  private meta: { SHEET: { NAME: string } } | null = null;

  /**
   * ⚠️ Internal constructor – prefer `createSheet(...)` for safety.
   */
  public constructor(gasSheet: GoogleAppsScript.Spreadsheet.Sheet) {
    this.gasSheet = gasSheet;
  }

  get firstRowRange() {
    const lastColumn = this.gasSheet.getLastColumn();
    const firstRowRange = this.gasSheet.getRange(1, 1, 1, lastColumn);
    return firstRowRange;
  }

  get name(): string {
    return this.gasSheet.getName();
  }

  get raw(): GoogleAppsScript.Spreadsheet.Sheet {
    return this.gasSheet;
  }

  // ─── Sheet passthroughs ───────────────────────────────────────

  activate(): void {
    this.gasSheet.activate();
  }

  clear(): void {
    this.gasSheet.clear();
  }

  clearContents(): void {
    this.gasSheet.clearContents();
  }

  deleteExcessColumns(): void {
    const frozenColumns = this.gasSheet.getFrozenColumns();
    const lastColumn = this.gasSheet.getLastColumn();
    const maxColumns = this.gasSheet.getMaxColumns();
    const startColumn = Math.max(lastColumn + 1, frozenColumns + 2);
    const howMany = maxColumns - startColumn + 1;
    if (howMany > 0) {
      this.gasSheet.deleteColumns(startColumn, howMany);
    }
  }

  deleteExcessRows(): void {
    const frozenRows = this.gasSheet.getFrozenRows();
    const lastRow = this.gasSheet.getLastRow();
    const startRow = lastRow <= frozenRows ? frozenRows + 2 : lastRow + 1;
    const maxRows = this.gasSheet.getMaxRows();
    const howMany = maxRows - startRow + 1;
    if (howMany > 0) {
      this.gasSheet.deleteRows(startRow, howMany);
    }
  }

  deleteRows(startRow: number, howMany: number): void {
    this.gasSheet.deleteRows(startRow, howMany);
  }

  findRowByKey(searchColumn: string, keyValue: string) {
    const data = this.gasSheet
      .getRange(`${searchColumn}1:${searchColumn}${this.gasSheet.getLastRow()}`)
      .getValues();

    const rowIndex = data.findIndex((row) => row[0] === keyValue);
    return rowIndex !== -1 ? rowIndex + 1 : -1; // Add 1 for 1-based indexing, return -1 if not found
  }

  fixSheet(): void {
    Logger.log(`Sheet.fixSheet started: ${this.name}`);

    this.trimSheet();

    Logger.log(`Sheet.fixSheet finished: ${this.name}`);
  }

  getDataRange(): GoogleAppsScript.Spreadsheet.Range {
    return this.gasSheet.getDataRange();
  }

  getValue(range: string): any {
    return this.gasSheet.getRange(range).getValue();
  }

  setValue(range: string, value: any): void {
    this.gasSheet.getRange(range).setValue(value);
  }

  getRange(a1Notation: string): GoogleAppsScript.Spreadsheet.Range {
    return this.gasSheet.getRange(a1Notation);
  }

  getSheetName(): string {
    return this.gasSheet.getSheetName();
  }

  getSheetId(): number {
    return this.gasSheet.getSheetId();
  }

  /**
   * Returns the true last row and column with actual data (ignores formatting, formulas returning "").
   * @returns {{ lastRow: number, lastColumn: number }}
   */
  getTrueDataBounds(): { lastRow: number; lastColumn: number } {
    const sheet = this.gasSheet;
    const frozenRows = sheet.getFrozenRows();
    const frozenCols = sheet.getFrozenColumns();

    // --- Last Row ---
    const maxRows = sheet.getMaxRows();
    const lastCol = sheet.getLastColumn();
    let lastRow = frozenRows; // if only frozen rows contain data

    if (maxRows > frozenRows) {
      const height = maxRows - frozenRows;
      const values = sheet
        .getRange(frozenRows + 1, 1, height, lastCol)
        .getDisplayValues();
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i].some((v) => v !== "")) {
          lastRow = frozenRows + i + 1;
          break;
        }
      }
    }

    // --- Last Column ---
    const maxCols = sheet.getMaxColumns();
    const lastRowForCols = sheet.getLastRow();
    let lastColumn = frozenCols; // if only frozen cols contain data

    if (maxCols > frozenCols && lastRowForCols > 0) {
      const width = maxCols - frozenCols;
      const values = sheet
        .getRange(1, frozenCols + 1, lastRowForCols, width)
        .getDisplayValues();
      for (let c = values[0].length - 1; c >= 0; c--) {
        for (let r = 0; r < values.length; r++) {
          if (values[r][c] !== "") {
            lastColumn = frozenCols + c + 1;
            c = -1; // break outer loop
            break;
          }
        }
      }
    }

    return { lastRow, lastColumn };
  }

  /**
   * Returns the last column that contains actual data (ignores formatting and empty formulas).
   * @returns {number} The last column index with data (1-based).
   */
  getTrueLastColumn() {
    const range = this.gasSheet.getDataRange();
    const values = range.getValues();

    const rowMax = values.length;
    const colCount = values[0]?.length || 0;

    for (let c = colCount - 1; c >= 0; c--) {
      for (let r = 0; r < rowMax; r++) {
        if (values[r][c] !== "") return c + 1;
      }
    }
    return 0;
  }

  /**
   * Returns the last row that contains actual data (ignores formatting and empty formulas).
   * @returns {number} The last row index with data (1-based).
   */
  getTrueLastRow(): number {
    const range = this.gasSheet.getDataRange();
    const values = range.getValues();

    const colLimit = values[0].length;

    for (let r = values.length - 1; r >= 0; r--) {
      for (let c = 0; c < colLimit; c++) {
        const cell = values[r][c];
        if (cell !== "") return r + 1; // +1 because Apps Script is 1-based
      }
    }
    return 0; // all blank
  }

  isAccountSheet() {
    return isAccountSheetName(this.name);
  }

  setColumnWidth(column: number, width: number): void {
    this.gasSheet.setColumnWidth(column, width);
  }

  setActiveRange(range: GoogleAppsScript.Spreadsheet.Range): void {
    this.gasSheet.setActiveRange(range);
  }

  setMeta(meta: { SHEET: { NAME: string } }): void {
    this.meta = meta;
  }

  showColumns(start: number, num: number): void {
    this.gasSheet.showColumns(start, num);
  }

  hideColumn(column: GoogleAppsScript.Spreadsheet.Range): void {
    this.gasSheet.hideColumn(column);
  }

  sortByFirstColumn() {
    const sheet = this.gasSheet;
    // Get the range that contains data
    const dataRange = sheet.getDataRange();

    // Sort the range by the first column (column 1) in ascending order
    dataRange.sort({ column: 1, ascending: true });
  }

  sortByFirstColumnOmittingHeader() {
    const sheet = this.gasSheet;
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    // Skip sheets with no data rows
    if (lastRow <= 1 || lastCol === 0) {
      console.log(`${sheet.getSheetName()} skipped: no data to sort`);
      return;
    }

    try {
      const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
      const startTime = Date.now();
      range.sort({ column: 1, ascending: true });
      console.log(
        `${sheet.getSheetName()} sorted in ${Date.now() - startTime}ms`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          `Failed to sort ${sheet.getSheetName()}: ${error.message}`
        );
      } else {
        console.error(
          `Failed to sort ${sheet.getSheetName()}: ${String(error)}`
        );
      }
    }
  }

  trimSheet(): void {
    Logger.log(`Sheet.trimSheet started: ${this.name}`);

    const { lastRow, lastColumn } = this.getTrueDataBounds();
    const gasSheet = this.gasSheet;

    const maxRows = gasSheet.getMaxRows();
    const maxColumns = gasSheet.getMaxColumns();
    const frozenRows = gasSheet.getFrozenRows();
    const frozenCols = gasSheet.getFrozenColumns();

    // Must keep at least one unfrozen row/col
    const minRows = frozenRows + 1;
    const minCols = frozenCols + 1;

    // When no data beyond frozen panes, trim to exactly one unfrozen row/col
    const targetRows = Math.max(lastRow, minRows);
    const targetCols = Math.max(lastColumn, minCols);

    if (targetCols < maxColumns) {
      gasSheet.deleteColumns(targetCols + 1, maxColumns - targetCols);
    }
    if (targetRows < maxRows) {
      gasSheet.deleteRows(targetRows + 1, maxRows - targetRows);
    }

    if (maxRows === targetRows && maxColumns === targetCols) {
      Logger.log(`No trimming needed for ${this.name}`);
    } else {
      Logger.log(
        `Trimmed from ${maxRows} rows × ${maxColumns} columns to ${targetRows} rows × ${targetCols} columns`
      );
    }
    Logger.log(`Sheet.trimSheet finished: ${this.name}`);
  }
}
