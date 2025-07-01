/// <reference types="google-apps-script" />

import { OurFinances } from "./OurFinances";
import { Sheet } from "./Sheet";

export class BankDebitsDue {
  private spreadsheet: Spreadsheet;
  private sheet: Sheet;
  private howManyDaysAhead: number;

  static get COL_ACCOUNT_KEY() {
    return 0;
  }
  static get COL_CHANGE_AMOUNT() {
    return 1;
  }

  constructor(ourFinances: OurFinances) {
    this.spreadsheet = ourFinances.spreadsheet;
    this.sheet = this.spreadsheet.getSheetByName("Bank debits due");
    this.howManyDaysAhead = ourFinances.howManyDaysAhead;

    // Check if the sheet exists
    if (!this.sheet) {
      throw new Error(
        `Sheet "${this.getSheetName()}" not found in the spreadsheet.`
      );
    }
  }

  getScheduledTransactions() {
    return this.sheet.getDataRange().getValues();
  }

  getUpcomingDebits() {
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
