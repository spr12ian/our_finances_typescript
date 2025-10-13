import type { Sheet, Spreadsheet } from "@domain";
import { FastLog, methodStart } from "@logging";

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

  /** Run a block with start/finish logging. */
  protected withLog<T>(label: string, fn: () => T): T {
    const finish = methodStart(label, this.sheetName);
    try {
      return fn();
    } finally {
      finish();
    }
  }

  fixSheet() {
    return this.withLog("fixSheet", () => this.sheet.fixSheet());
  }

  formatSheet() {
    return this.withLog("formatSheet", () => this.sheet.formatSheet());
  }

  getCellValue(cellRangeA1format: string): any {
    return this.withLog("getCellValue", () =>
      this.sheet.getCellValue(cellRangeA1format)
    );
  }

  setCellNote(cellRangeA1format: string, note: string) {
    return this.withLog("setCellNote", () =>
      this.sheet.getRange(cellRangeA1format).setNote(note)
    );
  }

  setCellValue(cellRangeA1format: string, value: any): void {
    return this.withLog("setCellValue", () =>
      this.sheet.setCellValue(cellRangeA1format, value)
    );
  }

  trimSheet() {
    return this.withLog("trimSheet", () => this.sheet.trimSheet());
  }

  // protected start(label: string, ...args: unknown[]) {
  //   return FastLog.start(`[${this.sheetName}] ${label}`, ...args);
  // }
  // protected finish(label: string, t0: Date) {
  //   FastLog.finish(`[${this.sheetName}] ${label}`, t0);
  // }

  /** Convenient per-sheet logger. */
  protected log = (m: string, ...a: unknown[]) =>
    FastLog.log(`[${this.sheetName}] ${m}`, ...a);
}
