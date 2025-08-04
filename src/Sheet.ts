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
    Logger.log(`Checking Sheet: ${this.name}`);

    const lastRow = this.gasSheet.getLastRow();
    Logger.log(`Last row: ${lastRow}`);
    if (lastRow === 0) {
      Logger.log(`Sheet ${this.name} is empty.`);
      return;
    }

    const lastColumn = this.gasSheet.getLastColumn();
    Logger.log(`Last column: ${lastColumn}`);
    if (lastColumn === 0) {
      Logger.log(`Sheet ${this.name} is empty.`);
      return;
    }

    const maxRows = this.gasSheet.getMaxRows();
    Logger.log(`Max rows: ${maxRows}`);
    const maxColumns = this.gasSheet.getMaxColumns();
    Logger.log(`Max columns: ${maxColumns}`);
    // Clean up excess rows and columns
    // this.gasSheet.setFrozenRows(1);
    // this.gasSheet.setFrozenColumns(1);
    // Delete excess rows and columns if they exist
    this.trimSheet();
    Logger.log(`Checked Sheet: ${this.name}`);
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

  trimSheet(): Sheet {
    const sheet = this.gasSheet;
    const maxRows = sheet.getMaxRows();
    const maxCols = sheet.getMaxColumns();

    // --- 1. Find the "anchor column" (the one with the deepest non‑empty row) ---
    let bestCol = 1;
    let deepestRow = 0;
    for (let c = 1; c <= maxCols; c++) {
      const colLast = sheet.getRange(1, c, maxRows).getLastRow();
      if (colLast > deepestRow) {
        deepestRow = colLast;
        bestCol = c;
      }
    }

    // --- 2. Trim trailing rows after the real last row ---
    if (deepestRow < maxRows) {
      sheet.deleteRows(deepestRow + 1, maxRows - deepestRow);
    }

    // --- 3. Trim trailing columns after the last column with data ---
    const lastCol = sheet.getLastColumn();
    if (lastCol < maxCols) {
      sheet.deleteColumns(lastCol + 1, maxCols - lastCol);
    }

    Logger.log(
      `Sheet "${sheet.getName()}" trimmed. Rows = ${deepestRow}, Cols = ${lastCol}, AnchorCol = ${bestCol}`
    );

    return this;
  }
}
