/// <reference types="google-apps-script" />

import { MetaTransactionCategories as Meta } from "./constants";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";

export class TransactionCategories {
  private readonly sheet: Sheet;
  constructor(private readonly spreadsheet: Spreadsheet) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  updateFormulas() {
    for (const { cell, formula } of Meta.FORMULA_CONFIG) {
      this.sheet.getRange(cell).setFormula(formula);
    }
  }
}
