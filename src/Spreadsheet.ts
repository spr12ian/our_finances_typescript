/// <reference types="google-apps-script" />

import { Sheet } from "./Sheet";

/**
 * Thin, type‑safe wrapper around a GAS `Spreadsheet`.
 *
 * ▼ Why this wrapper?
 *   • Keeps your business logic free of global `SpreadsheetApp.*` calls.
 *   • Gives you strongly‑typed helpers (and IntelliSense) while still
 *     exposing the raw spreadsheet when you need full API surface.
 */
export class Spreadsheet {
  /** Cached GAS spreadsheet instance */
  private readonly ss: GoogleAppsScript.Spreadsheet.Spreadsheet;

  /** Lazily‑built map: sheet name → `Sheet` wrapper */
  private _sheetCache?: Map<string, Sheet>;

  private constructor(ss: GoogleAppsScript.Spreadsheet.Spreadsheet) {
    this.ss = ss;
  }

  /**
   * Factory: open by ID or fall back to the active spreadsheet.
   */
  static from(id?: string): Spreadsheet {
    const ss = typeof id === "string" && id.trim()
      ? SpreadsheetApp.openById(id)
      : SpreadsheetApp.getActiveSpreadsheet();

    if (!ss) {
      throw new Error("Unable to obtain a spreadsheet instance");
    }

    return new Spreadsheet(ss);
  }


  // ────────────────────────────────────────────────────────────
  //  Metadata getters
  // ────────────────────────────────────────────────────────────
  get name(): string {
    return this.ss.getName();
  }

  get url(): string {
    return this.ss.getUrl();
  }

  // ────────────────────────────────────────────────────────────
  //  Sheet access helpers
  // ────────────────────────────────────────────────────────────
  get activeSheet(): Sheet {
    return Sheet.from(this.ss.getActiveSheet())
  }

  get sheets(): Sheet[] {
    return this.ss.getSheets().map((s) => Sheet.from(s));
  }

  sheetByName(name: string): Sheet | null {
    return this.sheetMap.get(name) ?? null;
  }

  private get sheetMap(): Map<string, Sheet> {
    if (!this._sheetCache) {
      const entries: [string, Sheet][] = this.sheets.map((s) => [s.getSheetName(), s]);
      this._sheetCache = new Map(entries);
    }
    return this._sheetCache;
  }

  // ────────────────────────────────────────────────────────────
  //  Spreadsheet‑level operations
  // ────────────────────────────────────────────────────────────
  moveActiveSheetTo(position: number): void {
    this.ss.moveActiveSheet(position);
  }

  newFilterCriteria(): GoogleAppsScript.Spreadsheet.FilterCriteriaBuilder {
    return SpreadsheetApp.newFilterCriteria();
  }

  toast(message: string, title: string = '', timeoutSeconds: number = 5): void {
    this.ss.toast(message, title, timeoutSeconds);
  }

  // ────────────────────────────────────────────────────────────
  //  Escape hatch – expose the underlying GAS Spreadsheet
  // ────────────────────────────────────────────────────────────
  get raw(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    return this.ss;
  }
}
