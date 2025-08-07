import { MetaAccountBalances as Meta } from "./constants";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";

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
    Logger.log(`Fixing : ${this.sheet.name}`);
    this.sheet.fixSheet();
  }
}
