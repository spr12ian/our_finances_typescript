/// <reference types="google-apps-script" />

import { OurFinances } from "./OurFinances";
import type { Sheet } from "./Sheet";
import { createSheet } from "./Sheet";
import { activeSpreadsheet } from "./context";

import { getAmountAsGBP } from './functions';
export class BankDebitsDue {
  private sheet: Sheet;
  private howManyDaysAhead: number;

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
  constructor(ourFinances: OurFinances) {
    const sheet = activeSpreadsheet.raw.getSheetByName(
      BankDebitsDue.SHEET.NAME
    );

    if (!sheet) {
      throw new Error(
        `Sheet "${BankDebitsDue.SHEET.NAME}" not found in the spreadsheet.`
      );
    }
    this.sheet = createSheet(sheet);
    this.howManyDaysAhead = ourFinances.howManyDaysAhead;


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
