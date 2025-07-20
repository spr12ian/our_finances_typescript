/// <reference types="google-apps-script" />

import type { Sheet } from "./Sheet";
import { createSheet } from "./Sheet";

export class Dependencies {
  private sheet: Sheet;
  static get SHEET_NAME() {
    return "Dependencies";
  }
  constructor() {
    this.sheet = createSheet(Dependencies.SHEET_NAME);
  }

  getAllDependencies() {
    if (typeof this.allDependencies !== "undefined") {
      return this.allDependencies;
    }

    // Retrieve dependencies if not cached
    let allDependencies = this.getSheet().getDataRange().getValues();

    // Remove the first row (header or irrelevant row)
    allDependencies.shift();

    // Cache the result for future use
    this.allDependencies = allDependencies;

    return allDependencies;
  }

  getSheetName() {
    return this.sheet.getSheetName();
  }

  getSpreadsheetNameById(spreadsheetId) {
    try {
      const spreadsheet = new Spreadsheet(spreadsheetId);
      return spreadsheet.spreadsheetName;
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
    const allDependencies = this.getAllDependencies();
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
