import { getAccountSheets } from "./accountsFunctions";
import { MetaAccountsData as Meta } from "./constants";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
/**
 * Class to handle accounts data in the "Accounts data" sheet.
 * It reads data from individual account sheets and compiles it into a single sheet.
 */
export class AccountsData {
  private readonly sheet: Sheet;

  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  private _getAccountSheets() {
    const spreadsheet = this.spreadsheet;
    const accountSheets = getAccountSheets(spreadsheet);
    return accountSheets;
  }

  update() {
    const accountSheets = this._getAccountSheets();
    const outputRows = [Meta.SHEET.HEADER];
    for (const sheet of accountSheets) {
      const account = sheet.name.slice(1); // Remove leading underscore
      const lastRow = sheet.raw.getLastRow();
      if (lastRow < Meta.START_ROW) continue; // Skip empty sheets
      const data = sheet.raw
        .getRange(Meta.START_ROW, 1, lastRow - 1, Meta.NUM_COLUMNS)
        .getValues();
      for (const row of data) {
        if (row.every((cell) => cell === "")) continue; // Skip empty rows
        outputRows.push([account, ...row]); // Prepend column with sheet name (Account)
      }
    }

    this.sheet.clearContents();
    this.sheet.raw
      .getRange(1, 1, outputRows.length, outputRows[0].length)
      .setValues(outputRows);
  }
}
