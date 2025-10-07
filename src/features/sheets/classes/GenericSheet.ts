import type { Spreadsheet } from "@domain";
import { BaseSheet } from "../core";

export class GenericSheet extends BaseSheet {
  constructor(sheetName: string, spreadsheet: Spreadsheet) {
    super(sheetName, spreadsheet);
  }

  // Generic methods for all sheets go here
}
export const createGenericSheet = (sheetName: string) => (s: Spreadsheet) =>
  new GenericSheet(sheetName, s);
