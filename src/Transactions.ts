/// <reference types="google-apps-script" />

import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
import { MetaTransactions as Meta } from "./TransactionsMeta";

export class Transactions {
  private readonly sheet: Sheet;

  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  get raw(): Sheet {
    return this.sheet;
  }

  evaluateQueryFunction(queryString: string) {
    const sheet = this.sheet;
    const dataRange = sheet.getDataRange(); // Adjust the range as needed
    const a1range = `Transactions!${dataRange.getA1Notation()}`;

    // Construct the QUERY formula
    const formula = `=IFNA(QUERY(${a1range}, "${queryString}"), 0.0)`;

    // Add the formula to a temporary cell to evaluate it
    const tempCell = sheet.getRange("Z1");
    tempCell.setFormula(formula);

    // Get the result of the QUERY function
    const result = tempCell.getValue();

    // Clear the temporary cell
    tempCell.clear();

    return result;
  }

  getTotalByYear(where: string, taxYear: string) {
    const queryString = `SELECT SUM(I) WHERE J='${taxYear}' AND ${where} LABEL SUM(I) ''`;
    const result = this.evaluateQueryFunction(queryString);
    return result;
  }

  updateFormulas() {
    this.sheet
      .getRange("A1")
      .setFormula("=ARRAYFORMULA('Accounts data'!A1:H)");
  }
}
