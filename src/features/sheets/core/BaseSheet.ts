// src/sheets/core/BaseSheet.ts
import type { Sheet, Spreadsheet } from "@domain";
import { FastLog } from "@logging/FastLog";

export abstract class BaseSheet {
  constructor(
    public readonly name: string,
    public readonly spreadsheet: Spreadsheet,
    public readonly sheet: Sheet
  ) {}

  trimSheet() {
    this.sheet.trimSheet();
  }

  protected start(label: string, ...args: any[]) {
    return FastLog.start(`[${this.name}] ${label}`, ...args);
  }
  protected finish(label: string, t0: Date) {
    FastLog.finish(`[${this.name}] ${label}`, t0);
  }
  log = (m: string, ...a: any[]) => FastLog.log(`[${this.name}] ${m}`, ...a);
}
