/// <reference types="google-apps-script" />

import { MetaTransactionCategories as Meta } from "./constants";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";

export class TransactionCategories {
  private readonly sheet: Sheet;
  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  update() {
    return; // This was a run once fix that is no longer needed.
    // The function is kept for reference, but it does nothing now.
    const sheet = this.sheet;
    const lastRow = sheet.raw.getLastRow();
    const numRows = lastRow - Meta.START_ROW + 1;

    // Some sheets may be empty, so we check if there's data to process
    if (numRows <= 0) {
      console.warn("No data to update in Transaction Categories sheet.");
      return;
    }

    const FIRST_THREE_COLUMNS = 3; // Exclude the last column for processing

    // Single read from the sheet
    const inputRows = sheet.raw
      .getRange(Meta.START_ROW, 1, numRows, FIRST_THREE_COLUMNS)
      .getValues();

    const outputColAValues: string[][] = [];
    const outputColCValues: string[][] = [];

    for (const row of inputRows) {
      if (row.every((cell) => cell === "")) continue; // Skip empty rows

      let transactionDescription = row[0] as string; // Column A
      if (
        transactionDescription.startsWith("SVI2TJ ") &&
        transactionDescription.endsWith(" *")
      ) {
        continue; // Skip entire rows that match the pattern
      }

      if (transactionDescription.startsWith("SVI2TJ ")) {
        transactionDescription += " *"; // Append " *" to the description
      }

      outputColAValues.push([transactionDescription]);

      const category = row[2] as string; // Column C
      outputColCValues.push([category]);
    }

    this.sheet.raw
      .getRange(Meta.START_ROW, 1, numRows, FIRST_THREE_COLUMNS)
      .clearContent();

    // Write back only if we have data
    if (outputColAValues.length > 0) {
      sheet.raw
        .getRange(Meta.START_ROW, 1, outputColAValues.length)
        .setValues(outputColAValues);

      sheet.raw
        .getRange(Meta.START_ROW, 3, outputColCValues.length)
        .setValues(outputColCValues);
    }
  }

  updateFormulas() {
    for (const { cell, formula } of Meta.FORMULA_CONFIG) {
      this.sheet.getRange(cell).setFormula(formula);
    }
  }
}
