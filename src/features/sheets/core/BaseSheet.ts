import type { Sheet, Spreadsheet } from "@domain";
import { FastLog } from "@logging/FastLog";

export abstract class BaseSheet {
  /** Public sheet display name (useful for menus/logs). */
  public readonly name: string;

  /** Subclasses can access the spreadsheet if needed. */
  protected readonly spreadsheet: Spreadsheet;

  /** Concrete Sheet wrapper for this tab. */
  protected readonly sheet: Sheet;

  constructor(sheetName: string, spreadsheet: Spreadsheet) {
    this.name = sheetName;
    this.spreadsheet = spreadsheet;
    this.sheet = this.spreadsheet.getSheet(sheetName);
  }

  /** Run a block with start/finish logging. */
  protected withLog<T>(label: string, fn: () => T): T {
    const t0 = this.start(label);
    try {
      return fn();
    } finally {
      this.finish(label, t0);
    }
  }

  fixSheet() {
    return this.withLog("fixSheet", () => this.sheet.fixSheet());
  }

  formatSheet() {
    return this.withLog("formatSheet", () => this.sheet.formatSheet());
  }

  trimSheet() {
    return this.withLog("trimSheet", () => this.sheet.trimSheet());
  }

  protected start(label: string, ...args: unknown[]) {
    return FastLog.start(`[${this.name}] ${label}`, ...args);
  }
  protected finish(label: string, t0: Date) {
    FastLog.finish(`[${this.name}] ${label}`, t0);
  }

  /** Convenient per-sheet logger. */
  protected log = (m: string, ...a: unknown[]) =>
    FastLog.log(`[${this.name}] ${m}`, ...a);
}
