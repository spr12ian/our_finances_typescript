/// <reference types="google-apps-script" />

import type { Sheet } from "./Sheet";
import { createSheet } from "./SheetFactory";

export class DescriptionReplacements {
  private sheet: Sheet;
  static get SHEET_NAME() {
    return "Description replacements";
  }

  constructor() {
    this.sheet = createSheet(DescriptionReplacements.SHEET_NAME);
  }

  applyReplacements(accountSheet: Sheet) {
    const accountSheetName = accountSheet.sheetName;
    if (accountSheetName === this.getSheetName()) {
      throw new Error(
        `Cannot applyDescriptionReplacements to '${accountSheetName}'`
      );
    }

    const headerValue = accountSheet
      .getRange(1, AccountSheet.COLUMNS.DESCRIPTION)
      .getValue();
    if (!headerValue.startsWith("Description")) {
      throw new Error(
        `Unexpected description header '${headerValue}' in sheet: ${accountSheetName}`
      );
    }

    const lastRow = accountSheet.getLastRow();
    const numRows = lastRow + 1 - AccountSheet.ROW_DATA_STARTS;

    const range = accountSheet.getRange(
      AccountSheet.ROW_DATA_STARTS,
      AccountSheet.COLUMNS.DESCRIPTION,
      numRows,
      1
    );
    const values = range.getValues();

    let numReplacements = 0;

    const replacementsMap = this.getReplacementsMap();

    for (let row = 0; row < values.length; row++) {
      const description = values[row][0];
      if (replacementsMap.hasOwnProperty(description)) {
        values[row][0] = replacementsMap[description];
        numReplacements++;
      }
    }

    if (numReplacements > 0) {
      range.setValues(values);
    }
  }

  getReplacementsMap() {
    const replacements = this.sheet.getDataRange().getValues().slice(1);

    return replacements.reduce((map, [description, replacement]) => {
      map[description] = replacement;
      return map;
    }, {});
  }

  getSheetName() {
    return this.sheet.getSheetName();
  }

  getSheet() {
    return this.sheet;
  }
}
