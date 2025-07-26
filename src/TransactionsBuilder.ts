/// <reference types="google-apps-script" />

import { MetaTransactionsBuilder as Meta } from "./constants";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";

export class TransactionsBuilder {
  private sheet: Sheet;

  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  copyIfSheetExists() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getRange("A1:A" + sheet.getLastRow()).getValues();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    for (let i = 0; i < data.length; i++) {
      const keyName = data[i][0];
      const sheetName = "_" + keyName;
      if (keyName && ss.getSheetByName(sheetName)) {
        sheet.getRange(i + 1, 2).setValue(keyName); // Column B
      } else {
        sheet.getRange(i + 1, 2).setValue(""); // Optional: clear if not found
      }
    }
  }

  getTransactionFormulas() {
    try {
      // Retrieve the range values
      const range = this.sheet.getRange("G3:G4");
      const values = range.getValues();

      // Validate the retrieved values
      if (
        !Array.isArray(values) ||
        values.length !== 2 ||
        values[0].length === 0 ||
        values[1].length === 0
      ) {
        throw new Error(
          "Invalid range data: Expected a 2x1 array with formulas in G3 and G4."
        );
      }

      const [keyFormulaRow, valuesFormulaRow] = values;
      const keyFormula = keyFormulaRow[0];
      const valuesFormula = valuesFormulaRow[0];

      return {
        keyFormula,
        valuesFormula,
      };
    } catch (error) {
      throw error;
    }
  }
}
