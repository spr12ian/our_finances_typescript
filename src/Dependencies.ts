/// <reference types="google-apps-script" />

import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";

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
    const col = "B";
    const sheet = this.getSheet();
    const len = allDependencies.length;

    for (let index = 0; index < len; index++) {
      const spreadsheetId = allDependencies[index][0];
      const spreadsheetName = this.getSpreadsheetNameById(spreadsheetId);
      const row = index + 2;
      const a1Notation = col + row;
      const cell = sheet.getRange(a1Notation);
      cell.setValue(spreadsheetName);
    }
  }
}
