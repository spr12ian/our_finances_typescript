/// <reference types="google-apps-script" />
import { MetaBudgetAnnualTransactions as Meta } from "./constants";
import {
  getFormattedDate,
  getNewDate,
  getOrdinalDate,
  setupDaysIterator,
} from "./DateFunctions";
import { getAmountAsGBP } from "./MoneyUtils";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
export class BudgetAnnualTransactions {
  private readonly sheet: Sheet;
  constructor(private readonly spreadsheet: Spreadsheet) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  // Get all scheduled transactions from the sheet
  getScheduledTransactions() {
    const values = this.sheet.dataRange.getValues();
    // Lose the header row
    return values.slice(1);
  }

  // Main method to get upcoming debits
  getUpcomingDebits(howManyDaysAhead: number) {
    const today = getNewDate();
    let upcomingPayments = "";

    // Fetch scheduled transactions and remove the header row
    const scheduledTransactions = this.getScheduledTransactions();

    if (!scheduledTransactions.length) return upcomingPayments;

    // Iterate over each transaction and filter the valid ones
    scheduledTransactions.forEach((transaction) => {
      const {
        [Meta.COLUMNS.DATE]: date,
        [Meta.COLUMNS.CHANGE_AMOUNT]: changeAmount,
        [Meta.COLUMNS.DESCRIPTION]: description,
        [Meta.COLUMNS.FROM_ACCOUNT]: fromAccount,
        [Meta.COLUMNS.PAYMENT_TYPE]: paymentType,
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
    formattedDaySelected: string,
    changeAmount: number,
    fromAccount: string,
    paymentType: string,
    description: string,
    today: Date,
    howManyDaysAhead: number
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
