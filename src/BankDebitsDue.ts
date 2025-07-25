/// <reference types="google-apps-script" />


import { xLookup } from "./xLookup";
import { getAmountAsGBP } from "./MoneyUtils";
import type { Sheet } from "./Sheet";
import type { Spreadsheet } from "./Spreadsheet";
export class BankDebitsDue {
  private sheet: Sheet;
  private _howManyDaysAhead?: number;

  static get COL_ACCOUNT_KEY() {
    return 0;
  }
  static get COL_CHANGE_AMOUNT() {
    return 1;
  }

  static get SHEET() {
    return {
      NAME: "Bank debits due",
    };
  }
  constructor(spreadsheet: Spreadsheet) {
    try {
      this.sheet = spreadsheet.getSheet(BankDebitsDue.SHEET.NAME);
    } catch (error) {
      let message =
        "Unknown error accessing '" + BankDebitsDue.SHEET.NAME + "'";
      if (error instanceof Error) {
        message = error.message;
      }
      throw new Error(`Sheet initialization failed: ${message}`);
    }
  }

  get howManyDaysAhead():number {
    if (typeof this._howManyDaysAhead === "undefined") {
      const searchValue = "Look ahead";
      this._howManyDaysAhead = xLookup(searchValue, this.sheet, "F", "G");
    }
    return this._howManyDaysAhead;
  }

  getScheduledTransactions() {
    return this.sheet.getDataRange().getValues();
  }

  getUpcomingDebits(howManyDaysAhead:number) {
    let upcomingPayments = `Due in the next ${this.howManyDaysAhead} days:`;

    const scheduledTransactions = this.getScheduledTransactions();

    // Filter and format valid upcoming debits
    scheduledTransactions.forEach((transaction) => {
      const accountKey = transaction[BankDebitsDue.COL_ACCOUNT_KEY]?.trim(); // Optional chaining and trim
      const changeAmount = transaction[BankDebitsDue.COL_CHANGE_AMOUNT];

      if (accountKey && Math.abs(changeAmount) > 1) {
        upcomingPayments += `\n\t${accountKey} ${getAmountAsGBP(changeAmount)}`;
      }
    });

    return upcomingPayments;
  }
}
