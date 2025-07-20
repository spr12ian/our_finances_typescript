/// <reference types="google-apps-script" />

import { createSheet } from "./Sheet";
import type { Sheet } from "./Sheet";

export class Transactions {
  private sheet:Sheet
  static get SHEET() {
    return {
      NAME: "Transactions",
    };
  }

  constructor() {
    this.sheet = createSheet(Transactions.SHEET.NAME);
  }

  activate() {
    this.sheet.activate();
  }

  evaluateQueryFunction(queryString:string) {
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

  getTotalByYear(where:string, taxYear:string) {
    const queryString = `SELECT SUM(I) WHERE J='${taxYear}' AND ${where} LABEL SUM(I) ''`;
    const result = this.evaluateQueryFunction(queryString);
    return result;
  }

  updateBuilderFormulas(transactionFormulas) {
    // Validate input and extract formulas
    if (
      !transactionFormulas ||
      typeof transactionFormulas.keyFormula !== "string" ||
      typeof transactionFormulas.valuesFormula !== "string"
    ) {
      throw new Error(
        "Invalid transactionFormulas: Expected an object with 'keyFormula' and 'valuesFormula' as strings."
      );
    }

    const { keyFormula, valuesFormula } = transactionFormulas;

    // Sanitize formulas if needed (basic example, extend as required)
    const safeKeyFormula = keyFormula.trim();
    const safeValuesFormula = valuesFormula.trim();

    try {
      // Set formulas in a single batch operation
      this.sheet
        .getRange("A1:B1")
        .setFormulas([[`=${safeKeyFormula}`, `=${safeValuesFormula}`]]);
    } catch (error) {
      throw error;
    }
  }
}
