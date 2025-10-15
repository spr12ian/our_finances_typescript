import { FastLog } from "@logging/FastLog";
import { Sheet } from "./Sheet";

/**
 * Thin, type‑safe wrapper around a GAS `Spreadsheet`.
 */
export class Spreadsheet {
  private readonly ss: GoogleAppsScript.Spreadsheet.Spreadsheet;
  private _sheetCache: Map<string, Sheet> = new Map();

  public constructor(ss: GoogleAppsScript.Spreadsheet.Spreadsheet) {
    this.ss = ss;
  }

  static alert(message: string): void {
    SpreadsheetApp.getUi().alert(message);
  }

  static flush(): void {
    SpreadsheetApp.flush();
  }

  /** Static factory: open active spreadsheet */
  static getActive(): Spreadsheet {
    FastLog.log("Getting active spreadsheet");
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!ss) throw new Error("Unable to obtain a spreadsheet instance");

    const spreadsheet = new Spreadsheet(ss);

    FastLog.log(`Opened spreadsheet: ${ss.getName()} (ID: ${ss.getId()})`);
    return spreadsheet;
  }

  /** Static factory: open by ID */
  static openById(id: string): Spreadsheet {
    FastLog.log(`Opening spreadsheet by ID: ${id}`);
    if (!id) throw new Error("Spreadsheet ID is required");
    if (typeof id !== "string") {
      throw new Error("Spreadsheet ID must be a string");
    }
    const ss = SpreadsheetApp.openById(id);

    if (!ss) throw new Error("Unable to obtain a spreadsheet instance");

    const spreadsheet = new Spreadsheet(ss);

    FastLog.log(`Opened spreadsheet: ${ss.getName()} (ID: ${id})`);
    return spreadsheet;
  }

  // ─── Metadata ────────────────────────────────────────────────
  get id(): string {
    return this.ss.getId();
  }

  get name(): string {
    return this.ss.getName();
  }

  get url(): string {
    return this.ss.getUrl();
  }

  // ─── Sheets ───────────────────────────────────────────────────
  get activeSheet(): Sheet {
    return new Sheet(this.ss.getActiveSheet());
  }

  get sheets(): Sheet[] {
    return this.ss.getSheets().map((s) => this.getSheet(s.getName()));
  }

  get sheetNames(): string[] {
    return this.ss.getSheets().map((s) => s.getName());
  }

  deleteSheet(sheet: Sheet): void {
    const sheetName = sheet.name;
    if (!this.hasSheet(sheetName)) {
      throw new Error(`Sheet "${sheetName}" does not exist`);
    }
    this.ss.deleteSheet(sheet.raw);
    this._sheetCache.delete(sheetName);
  }

  /** Get a typed `Sheet` by name (cached) */
  getSheet(name: string): Sheet {
    if (this._sheetCache.has(name)) {
      return this._sheetCache.get(name)!;
    }

    const sheet = this.ss.getSheetByName(name);
    if (!sheet) throw new Error(`Sheet "${name}" not found`);

    const wrapped = new Sheet(sheet);
    this._sheetCache.set(name, wrapped);
    return wrapped;
  }

  getSheetByMeta(meta: { SHEET: { NAME: string } }): Sheet {
    const sheet = this.getSheet(meta.SHEET.NAME);
    // sheet.setMeta(meta);
    return sheet;
  }

  hasSheet(name: string): boolean {
    return this.ss.getSheetByName(name) !== null;
  }

  insertSheet(name: string): Sheet {
    if (this.hasSheet(name)) {
      throw new Error(`Sheet "${name}" already exists`);
    }
    const sheet = this.ss.insertSheet(name);
    const wrapped = new Sheet(sheet);
    this._sheetCache.set(name, wrapped);
    return wrapped;
  }

  // ─── Spreadsheet-level API ────────────────────────────────────
  moveActiveSheetTo(position: number): void {
    this.ss.moveActiveSheet(position);
  }

  newFilterCriteria(): GoogleAppsScript.Spreadsheet.FilterCriteriaBuilder {
    return SpreadsheetApp.newFilterCriteria();
  }

  sortSheets() {
    const ss = this.ss;
    const sheetNames = this.sheetNames.sort();

    for (let j = 0; j < sheetNames.length; j++) {
      const sheet = this.getSheet(sheetNames[j]).raw;
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(j + 1);
    }
  }

  toast(message: string, title = "", timeoutSeconds = 5): void {
    this.ss.toast(message, title, timeoutSeconds);
  }

  // ─── Escape hatch ─────────────────────────────────────────────
  get raw(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    return this.ss;
  }
}
