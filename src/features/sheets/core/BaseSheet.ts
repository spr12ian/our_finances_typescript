import type { Sheet, Spreadsheet } from "@domain";
import { FastLog, WithLog, methodStart } from "@logging";

export abstract class BaseSheet {
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

  // protected start(label: string, ...args: unknown[]) {
  //   return FastLog.start(`[${this.sheetName}] ${label}`, ...args);
  // }
  // protected finish(label: string, t0: Date) {
  //   FastLog.finish(`[${this.sheetName}] ${label}`, t0);
  // }

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
