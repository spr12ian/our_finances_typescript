import type { Sheet, Spreadsheet } from "@domain";
import { FastLog, WithLog, methodStart } from "@logging";
import type { SheetKey } from "src/constants/sheetNames";

export abstract class BaseSheet {
  // Every subclass must declare this:
  static readonly sheetName: SheetKey;

  /** Public sheet display name (useful for menus/logs). */
  public readonly sheetName: string;

  /** Subclasses can access the spreadsheet if needed. */
  protected readonly spreadsheet: Spreadsheet;

  /** Concrete Sheet wrapper for this tab. */
  protected readonly sheet: Sheet;

  constructor(sheetName: string, spreadsheet: Spreadsheet) {
    this.sheetName = sheetName;
    this.spreadsheet = spreadsheet;
    this.sheet = this.spreadsheet.getSheet(sheetName);
  }

  get dataRows(): any[][] {
    return this.sheet.dataRows;
  }

  @WithLog()
  fixSheet() {
    return this.sheet.fixSheet();
  }

  @WithLog()
  formatAsDate(rangeList: GoogleAppsScript.Spreadsheet.RangeList): void {
    this.sheet.formatAsDate(rangeList);
  }

  @WithLog()
  formatAsMoney(rangeList: GoogleAppsScript.Spreadsheet.RangeList): void {
    this.sheet.formatAsMoney(rangeList);
  }

  @WithLog()
  formatSheet() {
    return this.sheet.formatSheet();
  }

  @WithLog()
  getCellValue(cellRangeA1format: string): any {
    return this.sheet.getCellValue(cellRangeA1format);
  }

  @WithLog()
  getColumnWidth(column: number): number {
    return this.sheet.getColumnWidth(column);
  }

  @WithLog()
  setCellNote(cellRangeA1format: string, note: string) {
    return this.sheet.getRange(cellRangeA1format).setNote(note);
  }

  @WithLog()
  setCellValue(cellRangeA1format: string, value: any): void {
    return this.sheet.setCellValue(cellRangeA1format, value);
  }

  @WithLog()
  trimSheet() {
    return this.sheet.trimSheet();
  }

  /** Convenient per-sheet loggers. */
  protected error = (m: string, ...a: unknown[]) =>
    FastLog.error(`[${this.sheetName}] ${m}`, ...a);
  protected log = (m: string, ...a: unknown[]) =>
    FastLog.log(`[${this.sheetName}] ${m}`, ...a);
  protected start = (methodName: string) =>
    methodStart(methodName, this.sheetName);
  protected warn = (m: string, ...a: unknown[]) =>
    FastLog.warn(`[${this.sheetName}] ${m}`, ...a);
}
