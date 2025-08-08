/// <reference types="google-apps-script" />

import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
import { MetaTransactions as Meta } from "./constants";

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

  update() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const transactionSheet = this.sheet.raw;
    // const exclude = new Set(["_CVITRA", "_SVIIRF"]);
    const exclude = new Set(["_SVIIRF"]);
    // 1. Collect account sheet names (start with "_")
    const accountSheets = sheets
      .map((s) => s.getName())
      .filter((name) => name.startsWith("_") && !exclude.has(name))
      .sort(); // optional: consistent order

    // 2. Build array parts
    const header =
      '{"Account","Date","Description","Credit (£)","Debit (£)","Note","CPTY","Date CPTY"}';

    const parts = [header];
    for (const name of accountSheets) {
      const account = name.substring(1); // strip leading "_"
      parts.push(
        `{ARRAYFORMULA(IF(LEN('${name}'!A2:A),"${account}","")), '${name}'!A2:G}`
      );
    }

    const bigArray = `{${parts.join(";")}}`;

    // 3. Build QUERY + FILTER wrapper
    const query = `QUERY(${bigArray}, "select Col1,Col2,Col3,Col4,Col5,Col6,Col7,Col8 where Col2 is not null", 1)`;
    const filterCondition = `INDEX(${query}, , 2) <> ""`;
    const fullFormula = `=FILTER(${query}, ${filterCondition})`;
    // 4. Insert formula in Transactions!A1
    transactionSheet.getRange("A1").setFormula(fullFormula);
  }
}
