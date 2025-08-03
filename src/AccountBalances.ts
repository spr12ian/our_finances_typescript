import { MetaAccountBalances as Meta } from "./constants";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";

interface SheetMetaRow {
  sheetName: string;
  lastRow: number;
  lastColumn: number;
  maxRows: number;
  maxColumns: number;
}
/**
 * Class to handle the "Account balances" sheet.
 */
export class AccountBalances {
  private readonly sheet: Sheet;

  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    this.sheet = this.spreadsheet.getSheetByMeta(Meta);
  }

  fixSheet() {
    Logger.log(`Checking : ${this.sheet.name}`);
    this.sheet.fixSheet();
  }
}
