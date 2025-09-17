// @sheets/sheetTypes.ts
import type { Spreadsheet } from "@domain/Spreadsheet";

export interface ExtendedSheet {
  name: string;
}

// If every non-account sheet takes only spreadsheet:
export type SheetCtor = new (spreadsheet: Spreadsheet) => ExtendedSheet;
export type SheetFactory = (spreadsheet: Spreadsheet) => ExtendedSheet;
