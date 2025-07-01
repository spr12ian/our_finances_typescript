/// <reference types="google-apps-script" />

import { Sheet } from "./Sheet";

export class Spreadsheet {
  constructor(spreadsheetId) {
    if (spreadsheetId) {
      try {
        this.spreadsheet = this.openById(spreadsheetId);
      } catch (error) {
        throw error;
      }
    } else {
      try {
        this.spreadsheet = this.getActiveSpreadsheet();
      } catch (error) {
        throw error;
      }
    }
  }

  getActiveSpreadsheet() {
    if (!this._activeSpreadsheet) {
      this._activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    return this._activeSpreadsheet;
  }

  getActiveSheet() {
    const activeSheet = this.spreadsheet.getActiveSheet();
    examineObject(activeSheet, "activeSheet");

    const iswActiveSheet = new Sheet(activeSheet);
    examineObject(iswActiveSheet, "iswActiveSheet");

    return iswActiveSheet;
  }

  getGasSheets() {
    if (!this._gasSheets) {
      this._gasSheets = this.spreadsheet.getSheets();
    }

    return this._gasSheets;
  }

  getSheetByName(sheetName: string): Sheet | null {
    let sheet;

    try {
      const sheetMap = this.getSheetMap();
      const sheetCount = Object.keys(sheetMap).length;

      sheet = sheetMap[sheetName];

      if (!sheet) {
        return null; // Explicitly return null for missing sheets
      }
    } catch (error) {
      return null; // Return null in case of errors
    }

    return sheet;
  }

  getSheetMap() {
    if (!this._sheetMap) {
      // Lazily initialize the sheet map only when it's accessed
      const sheets = this.getSheets();

      // Ensure `sheets` is an array before processing
      if (!Array.isArray(sheets)) {
        throw new Error("getSheets() must return an array");
      }

      // Create the sheet map efficiently using Object.fromEntries
      this._sheetMap = Object.fromEntries(
        sheets.map((sheet) => [sheet.getName(), sheet])
      );
    }

    return this._sheetMap;
  }

  getSheets() {
    if (!this._sheets) {
      this._sheets = this.getGasSheets().map((sheet) => new Sheet(sheet));
    }
    return this._sheets;
  }

  getSpreadsheetName() {
    return this.spreadsheet.getName();
  }

  getUrl() {
    return this.spreadsheet.getUrl();
  }

  moveActiveSheet(sheetNumber) {
    this.spreadsheet.moveActiveSheet(sheetNumber);
  }

  newFilterCriteria() {
    return gasSpreadsheetApp.newFilterCriteria();
  }

  openById(spreadsheetId) {
    if (!this.spreadsheets[spreadsheetId]) {
      this.spreadsheets[spreadsheetId] = SpreadsheetApp.openById(spreadsheetId);
    }
    return this.spreadsheets[spreadsheetId];
  }

  setActiveSheet(sheet) {
    examineObject(sheet);
    this.spreadsheet.setActiveSheet(sheet.sheet);
  }

  toast(msg, title, timeoutSeconds) {
    this.spreadsheet.toast(msg, title, timeoutSeconds);
  }
}
