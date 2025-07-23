/// <reference types="google-apps-script" />

/**
 * Thin wrapper around a GAS Sheet.
 * Prefer using `createSheet(...)` to instantiate.
 */
export class Sheet {
  private readonly gasSheet: GoogleAppsScript.Spreadsheet.Sheet;

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

  setColumnWidth(column: number, width: number): void {
    this.gasSheet.setColumnWidth(column, width);
  }

  setActiveRange(range: GoogleAppsScript.Spreadsheet.Range): void {
    this.gasSheet.setActiveRange(range);
  }

  showColumns(start: number, num: number): void {
    this.gasSheet.showColumns(start, num);
  }

  hideColumn(column: GoogleAppsScript.Spreadsheet.Range): void {
    this.gasSheet.hideColumn(column);
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
      console.log(`${sheet.getSheetName()} sorted in ${Date.now() - startTime}ms`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Failed to sort ${sheet.getSheetName()}: ${error.message}`);
      } else {
        console.error(`Failed to sort ${sheet.getSheetName()}: ${String(error)}`);
      }
    }

  }


  trimSheet(): Sheet {
    this.deleteExcessColumns();
    this.deleteExcessRows();
    return this;
  }

  get raw(): GoogleAppsScript.Spreadsheet.Sheet {
    return this.gasSheet;
  }
}
