/// <reference types="google-apps-script" />

import { getType } from "./functions";
import { Spreadsheet } from "./Spreadsheet";

export class Sheet {
  private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private _spreadsheet?: Spreadsheet;
  private _spreadsheetName?: string;

  private constructor(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    this.sheet = sheet;
  }

  static from(input: unknown): Sheet {
    const xType = getType(input);

    if (xType === "string") {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(input as string);
      if (!sheet) {
        throw new Error(`Sheet with name "${input}" not found`);
      }
      return new Sheet(sheet);
    }

    if (xType === "object" && input instanceof Sheet) {
      return input;
    }

    if (xType === "object" && input instanceof GoogleAppsScript.Spreadsheet.Sheet) {
      return new Sheet(input as GoogleAppsScript.Spreadsheet.Sheet);
    }

    if (input === null) {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      if (!sheet) {
        throw new Error("No active sheet found");
      }
      return new Sheet(sheet);
    }

    throw new TypeError(`Unexpected input type: ${xType}`);
  }

  get spreadsheet(): Spreadsheet {
    if (!this._spreadsheet) {
      this._spreadsheet = Spreadsheet.from(this.sheet.getParent().getId());
    }
    return this._spreadsheet;
  }

  get spreadsheetName(): string {
    if (!this._spreadsheetName) {
      this._spreadsheetName = this.spreadsheet.name;
    }
    return this._spreadsheetName;
  }

  activate(): void {
    this.sheet.activate();
  }

  clear(): void {
    this.sheet.clear();
  }

  clearContents(): void {
    this.sheet.clearContents();
  }

  deleteExcessColumns(): void {
    const frozenColumns = this.sheet.getFrozenColumns();
    const lastColumn = this.sheet.getLastColumn();
    const maxColumns = this.sheet.getMaxColumns();

    const startColumn = Math.max(lastColumn + 1, frozenColumns + 2);
    const howMany = maxColumns - startColumn + 1;

    if (howMany > 0) {
      this.sheet.deleteColumns(startColumn, howMany);
    }
  }

  deleteExcessRows(): void {
    const frozenRows = this.sheet.getFrozenRows();
    const lastRow = this.sheet.getLastRow();
    const startRow = lastRow <= frozenRows ? frozenRows + 2 : lastRow + 1;
    const maxRows = this.sheet.getMaxRows();
    const howMany = maxRows - startRow + 1;

    if (howMany > 0) {
      this.sheet.deleteRows(startRow, howMany);
    }
  }

  deleteRows(startRow: number, howMany: number): void {
    this.sheet.deleteRows(startRow, howMany);
  }

  getDataRange(): GoogleAppsScript.Spreadsheet.Range {
    return this.sheet.getDataRange();
  }

  getValue(range: string): any {
    return this.sheet.getRange(range).getValue();
  }

  setValue(range: string, value: any): void {
    this.sheet.getRange(range).setValue(value);
  }

  getRange(a1Notation: string): GoogleAppsScript.Spreadsheet.Range {
    return this.sheet.getRange(a1Notation);
  }

  getSheetName(): string {
    return this.sheet.getSheetName();
  }

  getSheetId(): number {
    return this.sheet.getSheetId();
  }

  setColumnWidth(column: number, width: number): void {
    this.sheet.setColumnWidth(column, width);
  }

  setActiveCell(range: GoogleAppsScript.Spreadsheet.Range | string): void {
    if (typeof range === "string") {
      this.sheet.setActiveCell(this.sheet.getRange(range));
    } else {
      this.sheet.setActiveCell(range);
    }
  }


  setActiveRange(range: GoogleAppsScript.Spreadsheet.Range): void {
    this.sheet.setActiveRange(range);
  }

  showColumns(start: number, num: number): void {
    this.sheet.showColumns(start, num);
  }

  hideColumn(column: GoogleAppsScript.Spreadsheet.Range): void {
    this.sheet.hideColumn(column);
  }

  trimSheet(): Sheet {
    this.deleteExcessColumns();
    this.deleteExcessRows();
    return this;
  }

  // Expose raw GAS sheet when necessary
  get raw(): GoogleAppsScript.Spreadsheet.Sheet {
    return this.sheet;
  }
}
