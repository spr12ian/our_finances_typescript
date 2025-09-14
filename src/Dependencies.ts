/// <reference types="google-apps-script" />

import type { Sheet } from "./domain/Sheet";
import { Spreadsheet } from "./domain/Spreadsheet";

export class Dependencies {
  #allDependencies: any[][] | undefined;
  private readonly sheet: Sheet;
  static get SHEET_NAME() {
    return "Dependencies";
  }
  constructor(private readonly spreadsheet: Spreadsheet) {
    this.sheet = this.spreadsheet.getSheet(Dependencies.SHEET_NAME);
  }

  get allDependencies(): any[][] {
    if (typeof this.#allDependencies !== "undefined") {
      return this.allDependencies;
    }

    // Retrieve dependencies if not cached
    let allDependencies = this.sheet.dataRange.getValues();

    // Remove the first row (header or irrelevant row)
    allDependencies.shift();

    // Cache the result for future use
    this.#allDependencies = allDependencies;

    return allDependencies;
  }

  getSheetName() {
    return this.sheet.getSheetName();
  }

  getSpreadsheetNameById(spreadsheetId: string) {
    try {
      const spreadsheet = Spreadsheet.openById(spreadsheetId);
      return spreadsheet.name;
    } catch (error) {
      return null; // or handle it accordingly
    }
  }

  getSheet() {
    return this.sheet;
  }

  /**
   * Updates the spreadsheet names for all dependencies in the specified column.
   */
  updateAllDependencies() {
    const allDependencies = this.allDependencies;
    const sheet = this.getSheet();
    const len = allDependencies.length;

    // Build a 2D array for setValues
    const values: string[][] = new Array(len);
    for (let i = 0; i < len; i++) {
      const spreadsheetId = allDependencies[i][0];
      if (spreadsheetId) {
        const spreadsheetName = this.getSpreadsheetNameById(spreadsheetId);
        if (spreadsheetName) {
          values[i] = [spreadsheetName];
        } else {
          values[i] = [""];
        }
      } else {
        values[i] = [""];
      }
    }

    // Write once: column B starting at row 2
    sheet.raw.getRange(2, 2, len, 1).setValues(values);
  }
}
