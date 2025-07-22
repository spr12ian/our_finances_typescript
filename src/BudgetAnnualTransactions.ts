/// <reference types="google-apps-script" />

import type { Spreadsheet } from "./Spreadsheet";
import { getFormattedDate, getNewDate, getOrdinalDate, setupDaysIterator } from "./DateUtils";
import { getAmountAsGBP } from "./MoneyUtils";
import type { Sheet } from "./Sheet";
import { createSheet } from "./SheetFactory";
export class BudgetAnnualTransactions {
  private sheet: Sheet;
  static get COLUMNS() {
    return {
      DATE: 0,
      DESCRIPTION: 1,
      CHANGE_AMOUNT: 3,
      FROM_ACCOUNT: 4,
      PAYMENT_TYPE: 5,
    };
  }
  static get SHEET() {
    return {
      NAME: "Budget annual transactions",
    };
  }

  constructor(spreadsheet: Spreadsheet) {
    const sheet = spreadsheet.getSheet(
      BudgetAnnualTransactions.SHEET.NAME
    );

    if (!sheet) {
      throw new Error(
        `Sheet "${BudgetAnnualTransactions.SHEET.NAME}" not found.`
      );
    }
    this.sheet = createSheet(sheet);
  }

  // Get all scheduled transactions from the sheet
  getScheduledTransactions() {
    const values = this.sheet.getDataRange().getValues();
    // Lose the header row
    return values.slice(1);
  }

  // Main method to get upcoming debits
  getUpcomingDebits(howManyDaysAhead:number) {
    const today = getNewDate();
    let upcomingPayments = "";

    // Fetch scheduled transactions and remove the header row
    const scheduledTransactions = this.getScheduledTransactions();

    if (!scheduledTransactions.length) return upcomingPayments;

    // Iterate over each transaction and filter the valid ones
    scheduledTransactions.forEach((transaction) => {
      const {
        [BudgetAnnualTransactions.COLUMNS.DATE]: date,
        [BudgetAnnualTransactions.COLUMNS.CHANGE_AMOUNT]: changeAmount,
        [BudgetAnnualTransactions.COLUMNS.DESCRIPTION]: description,
        [BudgetAnnualTransactions.COLUMNS.FROM_ACCOUNT]: fromAccount,
        [BudgetAnnualTransactions.COLUMNS.PAYMENT_TYPE]: paymentType,
      } = transaction;

      if (Math.abs(changeAmount) > 1) {
        const formattedDaySelected = getFormattedDate(
          new Date(date),
          "GMT+1",
          "dd/MM/yyyy"
        );

        // Generate payment details if the date falls within the upcoming days
        const paymentDetails = this._generatePaymentDetails(
          formattedDaySelected,
          changeAmount,
          fromAccount,
          paymentType,
          description,
          today,
          howManyDaysAhead
        );
        if (paymentDetails) {
          upcomingPayments += paymentDetails;
        }
      }
    });

    if (upcomingPayments.length) {
      upcomingPayments = "\nAnnual payment(s) due:\n" + upcomingPayments;
    }

    return upcomingPayments;
  }

  // Helper method to generate payment details
  _generatePaymentDetails(
    formattedDaySelected,
    changeAmount,
    fromAccount,
    paymentType,
    description,
    today,
    howManyDaysAhead:number
  ) {
    const { first, iterator: days } = setupDaysIterator(today);
    let day = first;

    for (let index = 0; index <= howManyDaysAhead; index++) {
      if (formattedDaySelected === day.day) {
        return `\t${getOrdinalDate(day.date)} ${getAmountAsGBP(
          changeAmount
        )} from ${fromAccount} by ${paymentType} ${description}\n`;
      }
      day = days.next();
    }

    return null;
  }
}
