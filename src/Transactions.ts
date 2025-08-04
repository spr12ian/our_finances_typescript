/// <reference types="google-apps-script" />

import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
import { MetaTransactions as Meta, MetaAccountsData } from "./constants";

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

  updateX() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = ss.getSheets();

    const HEADER = MetaAccountsData.SHEET.HEADER; // ["Account", "Date", ... , "Date CPTY"]
    const START_ROW = MetaAccountsData.START_ROW; // 2

    //const exclude = new Set(["_CVITRA", "_SVI3BH", "_SVIIRF"]);
    const exclude = new Set(["_CVITRA", "_SVIIRF"]);

    // Collect account sheets
    const accountSheets = allSheets
      .map((s) => s.getName())
      .filter((name) => name.startsWith("_") && !exclude.has(name));

    if (accountSheets.length === 0) {
      throw new Error("No account sheets found.");
    }

    // Build header row (Account + 7 others = 8 total)
    const headerRow = HEADER.map((h) => `"${h}"`).join(",");

    // Build ranges: first column is sheet name, then A:G
    const ranges = accountSheets.map((sheetName) => {
      const accountName = sheetName.substring(1); // remove leading "_"

      return `{ARRAYFORMULA(IF(LEN('${sheetName}'!A2:A),"${accountName}","")), '${sheetName}'!A${START_ROW}:G}`;
    });

    // Union of header row + sheet ranges
    const union = `{{${headerRow}};${ranges.join(";")}}`;

    // Query: keep all 8 cols, drop rows with blank Date (Col2)
    const formula = `=QUERY(${union}, "select Col1,Col2,Col3,Col4,Col5,Col6,Col7,Col8 where Col2 is not null", 1)`;

    this.sheet.getRange("A1").setFormula(formula);
    SpreadsheetApp.flush();
  }

  update() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const transactionSheet = this.sheet.raw;
    const exclude = new Set(["_CVITRA", "_SVIIRF"]);
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
