import { FastLog, methodStart } from "@logging/FastLog";

/**
 * Thin wrapper around a GAS Sheet.
 * Prefer using `Spreadsheet.getSheet(sheetName)` to instantiate.
 */
export class Sheet {
  #afterHeaderRange?: GoogleAppsScript.Spreadsheet.Range;
  #dataRange?: GoogleAppsScript.Spreadsheet.Range;
  #dataRows?: any[][];
  #firstRow?: any[][];
  #headerRange?: GoogleAppsScript.Spreadsheet.Range;
  #trueBounds?: { lastRow: number; lastColumn: number };
  private readonly gasSheet: GoogleAppsScript.Spreadsheet.Sheet;
  // private meta: { SHEET: { NAME: string } } | null = null;

  /**
   * ⚠️ Internal constructor – prefer `Spreadsheet.getSheet(sheetName)` for safety.
   */
  public constructor(gasSheet: GoogleAppsScript.Spreadsheet.Sheet) {
    this.gasSheet = gasSheet;
  }

  get afterHeaderRange(): GoogleAppsScript.Spreadsheet.Range {
    if (!this.#afterHeaderRange) {
      const lastColumn = this.getTrueDataBounds().lastColumn; // uses cache
      let frozenRows = this.gasSheet.getFrozenRows();
      if (frozenRows < 1) {
        // always at least one frozen/header row
        this.gasSheet.setFrozenRows(1);
        frozenRows = 1;
      }
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

  get dataRows(): any[][] {
    if (!this.#dataRows) {
      this.#dataRows = this.dataRange.getValues().slice(1);
    }
    return this.#dataRows;
  }

  get firstRow(): any[][] {
    if (!this.#firstRow) {
      this.#firstRow = this.firstRowRange.getValues();
    }
    return this.#firstRow;
  }

  get firstRowRange(): GoogleAppsScript.Spreadsheet.Range {
    const lastColumn = this.gasSheet.getLastColumn();
    const firstRowRange = this.gasSheet.getRange(1, 1, 1, lastColumn);
    return firstRowRange;
  }

  get headerRange(): GoogleAppsScript.Spreadsheet.Range {
    const logFinish = methodStart("headerRange", this.name);
    try {
      if (!this.#headerRange) {
        let frozenRows = this.gasSheet.getFrozenRows() || 1;
        if (frozenRows < 1) {
          // always at least one frozen/header row
          this.gasSheet.setFrozenRows(1);
          frozenRows = 1;
        }
        const lastColumn = this.getTrueDataBounds().lastColumn; // uses cache
        this.#headerRange = this.gasSheet.getRange(
          1,
          1,
          frozenRows,
          lastColumn
        );
      }
      return this.#headerRange;
    } finally {
      logFinish();
    }
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

  filterRows(predicate: (row: any[], rowIndex: number) => boolean) {
    return this.dataRows.filter(predicate);
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
    const logFinish = methodStart(this.fixSheet.name, this.name);

    this.trimSheet();
    this.formatSheet();

    logFinish();
  }

  formatAfterHeader(): void {
    const logFinish = methodStart(this.formatAfterHeader.name, this.name);

    let afterHeaderRange = this.afterHeaderRange;
    afterHeaderRange
      .setBorder(true, true, true, true, false, false)
      .setFontColor("#000000")
      .setFontFamily("Arial")
      .setFontSize(10)
      .setFontWeight("normal")
      .setVerticalAlignment("top")
      .setWrap(true);

    const firstRow = this.firstRow;
    if (firstRow.length > 0) {
      const firstRowValues = firstRow[0];
      const numColumns = firstRowValues.length;
      for (let col = 0; col < numColumns; col++) {
        const value = firstRowValues[col];
        if (typeof value === "string") {
          const trimmed = value.trim().toLowerCase();
          const columnDataRange = this.gasSheet.getRange(
            afterHeaderRange.getRow(),
            col + 1,
            afterHeaderRange.getNumRows(),
            1
          );
          // Apply formatting based on header content
          if (trimmed.startsWith("date")) {
            columnDataRange
              .setNumberFormat("dd/MM/yyyy")
              .setHorizontalAlignment("center");
          } else if (trimmed.endsWith("(£)")) {
            columnDataRange
              .setNumberFormat("£#,##0.00")
              .setHorizontalAlignment("right");
          } else if (trimmed.endsWith("(%)")) {
            columnDataRange
              .setNumberFormat("0.00%")
              .setHorizontalAlignment("right");
          } else if (trimmed.endsWith("(#)")) {
            columnDataRange
              .setNumberFormat("0")
              .setHorizontalAlignment("right");
          } else {
            // Default to text
            columnDataRange.setNumberFormat("@").setHorizontalAlignment("left");
          }
        }
      }
    }

    logFinish();
  }
  
  formatAsDate(rangeList: GoogleAppsScript.Spreadsheet.RangeList): void {
    rangeList.setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");
  }

  formatAsMoney(rangeList: GoogleAppsScript.Spreadsheet.RangeList): void {
    rangeList.setNumberFormat("£#,##0.00").setHorizontalAlignment("right");
  }

  formatHeader(): void {
    const logFinish = methodStart(this.formatHeader.name, this.name);

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

    logFinish();
  }

  formatSheet(): void {
    const logFinish = methodStart(this.formatSheet.name, this.name);

    this.formatHeader();
    this.formatAfterHeader();

    logFinish();
  }

  getAllValues(): any[][] {
    return this.dataRange.getValues();
  }

  /**
   * Returns all values from a column, excluding the header.
   * @param columnIndex - 1-based index of the column (A = 1).
   */
  getColumnData(columnIndex: number): string[] {
    const sheet = this.gasSheet;
    const numRows = sheet.getLastRow() - 1;
    if (numRows <= 0) return [];

    const data = sheet.getRange(2, columnIndex, numRows).getValues();
    return data.map((row) => String(row[0]));
  }

  /**
   * Returns all values from a column identified by its header name.
   * @param columnName - The header label of the column.
   */
  getColumnDataByName(columnName: string): string[] {
    const sheet = this.gasSheet;
    const headers = sheet.getDataRange().getValues()[0];
    const colIndex = headers.indexOf(columnName) + 1; // Convert to 1-based

    if (colIndex === 0) {
      throw new Error(`Column "${columnName}" not found.`);
    }

    return this.getColumnData(colIndex);
  }

  /**
   * Returns the pixel width of a column in a Sheet.
   *
   * @param {number} column - 1-based column index
   * @returns {number} - Column width in pixels
   */
  getColumnWidth(column: number): number {
    return this.gasSheet.getColumnWidth(column);
  }

  getRangesWhereColumnEquals(col: number, match: string) {
    const gasSheet = this.gasSheet;
    // Get all values in the column (skipping header if needed)
    const values = gasSheet.getRange(1, col, gasSheet.getLastRow()).getValues(); // 2D array

    const rows: number[] = [];
    values.forEach((row, i) => {
      if (row[0] === match) {
        rows.push(i + 1); // +1 because getValues() is 0-based, sheet rows are 1-based
      }
    });

    if (rows.length === 0) {
      return null; // no match
    }

    // Example: return the full row ranges for matches
    return rows.map((r) =>
      gasSheet.getRange(r, 1, 1, gasSheet.getLastColumn())
    );
  }

  getCellValue(cellRangeA1format: string): any {
    return this.gasSheet.getRange(cellRangeA1format).getValue();
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
    const logFinish = methodStart(this.getTrueDataBounds.name, this.name);
    try {
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
    } finally {
      logFinish();
    }
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

  setCellValue(cellRangeA1format: string, value: any): void {
    this.gasSheet.getRange(cellRangeA1format).setValue(value);
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
    const logFinish = methodStart(this.trimSheet.name, this.name);

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
    logFinish();
  }
  // Call this after any mutating operation:
  private changed() {
    this.#dataRange = undefined;
    this.#trueBounds = undefined;
    this.#headerRange = undefined;
  }
}
