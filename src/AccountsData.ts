import { getAccountSheets } from "./accountsFunctions";
import { MetaAccountsData as Meta } from "./constants";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
/**
 * Class to handle accounts data in the "Accounts data" sheet.
 * It reads data from individual account sheets and compiles it into a single sheet.
 */
export class AccountsData {
  private sheet: Sheet; // Not readonly, as it may be recreated

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

  recreateSheet(outputRows: any[][]): void {
    if (!outputRows || outputRows.length === 0) {
      Logger.log("No data to write to the Accounts Data sheet.");
      return;
    }
    if (outputRows[0].length !== Meta.NUM_COLUMNS + 1) {
      Logger.log(
        `Output rows have incorrect number of columns: ${outputRows[0].length}. Expected: ${Meta.NUM_COLUMNS}`
      );
      return;
    }
    const spreadsheet = this.spreadsheet;
    spreadsheet.deleteSheet(this.sheet);

    this.sheet = spreadsheet.insertSheet(Meta.SHEET.NAME);
    const gasSheet = this.sheet.raw;

    const numRows = outputRows.length;
    const numCols = outputRows[0].length;

    // Ensure the sheet has the right size
    const maxRows = gasSheet.getMaxRows();
    const maxCols = gasSheet.getMaxColumns();
    if (maxRows < numRows) {
      gasSheet.insertRowsAfter(maxRows, numRows - maxRows);
    }
    if (maxCols < numCols) {
      gasSheet.insertColumnsAfter(maxCols, numCols - maxCols);
    }

    // Now it's safe to setValues
    gasSheet.getRange(1, 1, numRows, numCols).setValues(outputRows);
  }

  update() {
    const accountSheets = this._getAccountSheets();
    const outputRows = [Meta.SHEET.HEADER];
    for (const sheet of accountSheets) {
      const account = sheet.name.slice(1); // Remove leading underscore
      const lastRow = sheet.raw.getLastRow();
      const numRows = lastRow - Meta.START_ROW + 1;
      if (numRows <= 0) continue; // Skip empty sheets
      const data = sheet.raw
        .getRange(Meta.START_ROW, 1, numRows, Meta.NUM_COLUMNS)
        .getValues();
      for (const row of data) {
        if (row.every((cell) => cell === "")) {
          Logger.log(`Skipping empty row in sheet ${sheet.name}`);
          continue; // Skip empty rows
        }
        outputRows.push([account, ...row]); // Prepend column with sheet name (Account)
      }
    }

    this.recreateSheet(outputRows);
  }
}
