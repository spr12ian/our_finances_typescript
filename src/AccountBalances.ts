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
    Logger.log(`Started AccountBalances:fixSheet: ${this.sheet.name}`);
    this.sheet.fixSheet();
    Logger.log(`Finished AccountBalances:fixSheet: ${this.sheet.name}`);
  }
}
