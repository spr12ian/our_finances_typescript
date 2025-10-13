// @sheets/sheetTypes.ts
import type { Spreadsheet } from "@domain/Spreadsheet";

export interface ExtendedSheet {
  sheetName: string;
  trimSheet(): void;
}

// If every non-account sheet takes only spreadsheet:
export type SheetSheetConstructor = new (
  spreadsheet: Spreadsheet
) => ExtendedSheet;
export type SheetFactory = (spreadsheet: Spreadsheet) => ExtendedSheet;
