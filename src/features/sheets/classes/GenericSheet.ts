import type { Spreadsheet } from "@domain";
import { BaseSheet } from "../core";
import { propertyStart } from '@lib/logging/FastLog';

export class GenericSheet extends BaseSheet {
  constructor(sheetName: string, spreadsheet: Spreadsheet) {
    super(sheetName, spreadsheet);
  }

  // Generic methods for all sheets go here
}
export const createGenericSheet = (sheetName: string) => (s: Spreadsheet) => {
  const finish = propertyStart(`createGenericSheet(${sheetName})`, 'GenericSheet');
  const sheet = new GenericSheet(sheetName, s);
  finish();
  return sheet;
}
