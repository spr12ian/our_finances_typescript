/// <reference types="google-apps-script" />

import { getType } from "./TypeUtils";
import { isGasSheet } from "./GasSheetUtils";
import type { Spreadsheet } from "./Spreadsheet"; // type-only import avoids circular deps

export class Sheet {
  private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private _spreadsheet?: Spreadsheet;
  private _spreadsheetName?: string;

  /**
   * ⚠️ Internal constructor – prefer `createSheet(...)` for safety.
   */
  public constructor(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    this.sheet = sheet;
  }

  get spreadsheet(): Spreadsheet {
    if (!this._spreadsheet) {
      this._spreadsheet = SpreadsheetApp.openById(
        this.sheet.getParent().getId()
      ) as unknown as Spreadsheet;
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

  get raw(): GoogleAppsScript.Spreadsheet.Sheet {
    return this.sheet;
  }
}

/**
 * Creates a `Sheet` instance from flexible input:
 *   • string → sheet name
 *   • Sheet → returned as-is
 *   • GAS Sheet → wrapped
 *   • null → active sheet
 */
export function createSheet(input: unknown): Sheet {
  const xType = getType(input);

  if (xType === "string") {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(input as string);
    if (!sheet) throw new Error(`Sheet with name "${input}" not found`);
    return new Sheet(sheet);
  }

  if (xType === "object" && input instanceof Sheet) return input;

  if (isGasSheet(input)) {
    return new Sheet(input as GoogleAppsScript.Spreadsheet.Sheet);
  }

  if (input === null) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (!sheet) throw new Error("No active sheet found");
    return new Sheet(sheet);
  }

  throw new TypeError(`Unexpected input type: ${xType}`);
}
