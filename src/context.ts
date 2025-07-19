import { Spreadsheet } from "./Spreadsheet";

export const activeSpreadsheet = Spreadsheet.from(); // active spreadsheet
export const gasSpreadsheetApp = activeSpreadsheet.raw; // escape hatch if needed
