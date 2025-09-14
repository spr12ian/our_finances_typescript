/// <reference types="google-apps-script" />

import { FastLog } from "./lib/FastLog";

/**
 * Thin wrapper around a GAS Sheet.
 * Prefer using `Spreadsheet.getSheet(sheetName)` to instantiate.
 */
export class Sheet {
  #afterHeaderRange?: GoogleAppsScript.Spreadsheet.Range;
  #dataRange?: GoogleAppsScript.Spreadsheet.Range;
  #headerRange?: GoogleAppsScript.Spreadsheet.Range;
  #trueBounds?: { lastRow: number; lastColumn: number };
  private readonly gasSheet: GoogleAppsScript.Spreadsheet.Sheet;
  // private meta: { SHEET: { NAME: string } } | null = null;

  // Call this after any mutating operation:
  private changed() {
    this.invalidate();
  }

  private invalidate() {
    this.#dataRange = undefined;
    this.#trueBounds = undefined;
    this.#headerRange = undefined;
  }

  /**
   * ⚠️ Internal constructor – prefer `Spreadsheet.getSheet(sheetName)` for safety.
   */
  public constructor(gasSheet: GoogleAppsScript.Spreadsheet.Sheet) {
    this.gasSheet = gasSheet;
  }

  get afterHeaderRange(): GoogleAppsScript.Spreadsheet.Range {
    if (!this.#afterHeaderRange) {
      const lastColumn = this.getTrueDataBounds().lastColumn; // uses cache
      let frozenRows = this.gasSheet.getFrozenRows() || 1;
      this.#afterHeaderRange = this.gasSheet.getRange(
        frozenRows + 1,
        1,
        this.gasSheet.getMaxRows() - frozenRows,
        lastColumn
      );
    }
    return this.#afterHeaderRange;
  }

  get dataRange(): GoogleAppsScript.Spreadsheet.Range {
    if (!this.#dataRange) {
      this.#dataRange = this.gasSheet.getDataRange();
    }
    return this.#dataRange;
  }

  get firstRowRange(): GoogleAppsScript.Spreadsheet.Range {
    const lastColumn = this.gasSheet.getLastColumn();
    const firstRowRange = this.gasSheet.getRange(1, 1, 1, lastColumn);
    return firstRowRange;
  }

  get headerRange(): GoogleAppsScript.Spreadsheet.Range {
    if (!this.#headerRange) {
      const lastColumn = this.getTrueDataBounds().lastColumn; // uses cache
      let frozenRows = this.gasSheet.getFrozenRows() || 1;
      this.#headerRange = this.gasSheet.getRange(1, 1, frozenRows, lastColumn);
    }
    return this.#headerRange;
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
    SpreadsheetApp.flush(); // Ensure the sheet is activated before further operations
  }

  clear(): void {
    this.gasSheet.clear();
    this.changed();
  }

  clearContents(): void {
    this.gasSheet.clearContents();
    this.changed();
  }

  deleteExcessColumns(): void {
    const frozenColumns = this.gasSheet.getFrozenColumns();
    const lastColumn = this.gasSheet.getLastColumn();
    const maxColumns = this.gasSheet.getMaxColumns();
    const startColumn = Math.max(lastColumn + 1, frozenColumns + 2);
    const howMany = maxColumns - startColumn + 1;
    if (howMany > 0) {
      this.gasSheet.deleteColumns(startColumn, howMany);
      this.changed();
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
      this.changed();
    }
  }

  deleteRows(startRow: number, howMany: number): void {
    this.gasSheet.deleteRows(startRow, howMany);
    this.changed();
  }

  findRowByKey(searchColumn: string, keyValue: string): number {
    const colA1 = `${searchColumn}:${searchColumn}`;
    const r = this.gasSheet.getRange(colA1);
    const tf = r
      .createTextFinder(keyValue)
      .matchEntireCell(true)
      .matchCase(false);
    const m = tf.findNext();
    return m ? m.getRow() : -1;
  }

  fixSheet(): void {
    FastLog.log(`Started Sheet.fixSheet: ${this.name}`);

    this.trimSheet();
    this.formatSheet();

    FastLog.log(`Finished Sheet.fixSheet: ${this.name}`);
  }

  formatAfterHeader(): void {
    FastLog.log(`Started Sheet.formatAfterHeader: ${this.name}`);

    let afterHeaderRange = this.afterHeaderRange;
    afterHeaderRange
      .setBorder(true, true, true, true, false, false)
      .setFontColor("#000000")
      .setFontFamily("Arial")
      .setFontSize(10)
      .setFontWeight("normal")
      .setHorizontalAlignment("left")
      .setVerticalAlignment("top")
      .setWrap(true);

    FastLog.log(`Finished Sheet.formatAfterHeader: ${this.name}`);
  }

  formatHeader(): void {
    FastLog.log(`Started Sheet.formatHeader: ${this.name}`);

    let headerRange = this.headerRange;
    headerRange
      .setBorder(true, true, true, true, false, false)
      .setBackground("#f0f0f0")
      .setFontFamily("Arial")
      .setFontSize(12)
      .setFontWeight("bold")
      .setNumberFormat("@")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrap(true);

    FastLog.log(`Finished Sheet.formatHeader: ${this.name}`);
  }

  formatSheet(): void {
    FastLog.log(`Started Sheet.formatSheet: ${this.name}`);

    this.formatHeader();
    this.formatAfterHeader();

    FastLog.log(`Finished Sheet.formatSheet: ${this.name}`);
  }

  getAllValues(): any[][] {
    return this.dataRange.getValues();
  }

  getValue(range: string): any {
    return this.gasSheet.getRange(range).getValue();
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
    if (this.#trueBounds) return this.#trueBounds;

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
    this.#trueBounds = { lastRow, lastColumn };
    return this.#trueBounds;
  }

  hideColumn(column: GoogleAppsScript.Spreadsheet.Range): void {
    this.gasSheet.hideColumn(column);
  }

  setActiveRange(range: GoogleAppsScript.Spreadsheet.Range): void {
    this.gasSheet.setActiveRange(range);
  }

  setBackground(a1range: string, background = "#FFFFFF"): void {
    this.getRange(a1range).setBackground(background);
  }

  setDateValidation(a1range: string) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireDate()
      .setAllowInvalid(false)
      .setHelpText("Please enter a valid date in DD/MM/YYYY format.")
      .build();
    this.getRange(a1range).setDataValidation(rule);
  }

  setFontWeightBold(...a1ranges: string[]): void {
    a1ranges.forEach((a1range) => {
      this.getRange(a1range).setFontWeight("bold");
    });
  }

  /* Background colour can be cyan */
  setFont(
    fontFamily: string = "Arial",
    fontSize: number = 10,
    fontColor: string = "#000000"
  ): GoogleAppsScript.Spreadsheet.Range {
    this.dataRange
      .setFontFamily(fontFamily)
      .setFontSize(fontSize)
      .setFontColor(fontColor);
    return this.dataRange;
  }

  setHorizontalAlignmentLeft(a1range: string) {
    this.getRange(a1range).setHorizontalAlignment("left");
  }

  setHorizontalAlignmentRight(a1range: string) {
    this.getRange(a1range).setHorizontalAlignment("right");
  }

  // setMeta(meta: { SHEET: { NAME: string } }): void {
  //   this.meta = meta;
  // }

  setNumberFormat(a1range: string, format: string) {
    this.getRange(a1range).setNumberFormat(format);
    this.getRange(a1range).setHorizontalAlignment("right");
  }

  setNumberFormatAsUKCurrency(...a1ranges: string[]): void {
    a1ranges.forEach((a1range) => {
      this.setNumberFormat(a1range, "£#,##0.00");
    });
  }

  /**
   * Formats the given A1 cell ranges as dates (dd/MM/yyyy)
   * and applies date validation to each.
   *
   * @param {...string} a1ranges - One or more A1 notation ranges (e.g. "A2:A10").
   */
  setNumberFormatAsDate(...a1ranges: string[]): void {
    a1ranges.forEach((a1range) => {
      this.setNumberFormat(a1range, "dd/MM/yyyy");
      this.setDateValidation(a1range);
    });
  }

  setValue(range: string, value: any): void {
    this.gasSheet.getRange(range).setValue(value);
    this.changed();
  }

  showColumns(start: number, num: number): void {
    this.gasSheet.showColumns(start, num);
  }

  sortByFirstColumn() {
    // Get the range that contains data
    const dataRange = this.dataRange;

    // Sort the range by the first column (column 1) in ascending order
    dataRange.sort({ column: 1, ascending: true });
    this.changed();
  }

  sortByFirstColumnOmittingHeader() {
    const sheet = this.gasSheet;
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    // Skip sheets with no data rows
    if (lastRow <= 1 || lastCol === 0) {
      FastLog.log(`${sheet.getSheetName()} skipped: no data to sort`);
      return;
    }

    try {
      const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
      const startTime = Date.now();
      range.sort({ column: 1, ascending: true });
      FastLog.log(
        `${sheet.getSheetName()} sorted in ${Date.now() - startTime}ms`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        FastLog.error(
          `Failed to sort ${sheet.getSheetName()}: ${error.message}`
        );
      } else {
        FastLog.error(
          `Failed to sort ${sheet.getSheetName()}: ${String(error)}`
        );
      }
    }
    this.changed();
  }

  trimSheet(): void {
    FastLog.log(`Started Sheet.trimSheet: ${this.name}`);

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
      this.changed();
    }
    if (targetRows < maxRows) {
      gasSheet.deleteRows(targetRows + 1, maxRows - targetRows);
      this.changed();
    }

    if (maxRows === targetRows && maxColumns === targetCols) {
      FastLog.log(`No trimming needed for ${this.name}`);
    } else {
      FastLog.log(
        `Trimmed from ${maxRows} rows × ${maxColumns} columns to ${targetRows} rows × ${targetCols} columns`
      );
    }
    FastLog.log(`Finished Sheet.trimSheet: ${this.name}`);
  }
}
