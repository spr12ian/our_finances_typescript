/// <reference types="google-apps-script" />
import { MetaBudgetAdHocTransactions as Meta } from "./constants";
import {
  getFormattedDate,
  getNewDate,
  getOrdinalDate,
  setupDaysIterator,
} from "./DateUtils";
import { getAmountAsGBP } from "./MoneyUtils";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
export class BudgetAdHocTransactions {
  private readonly sheet: Sheet;
  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  // Get all transactions from the sheet
  getScheduledTransactions() {
    const values = this.sheet.dataRange.getValues();
    // Lose the header row
    return values.slice(1);
  }

  // Main method to get upcoming debits
  getUpcomingDebits(howManyDaysAhead: number) {
    let upcomingPayments = "";

    // Fetch scheduled transactions and remove the header row
    const scheduledTransactions = this.getScheduledTransactions();

    if (!scheduledTransactions.length) return upcomingPayments;

    upcomingPayments += "\nAd hoc payment(s) due:\n";

    // Iterate over transactions and filter valid ones
    scheduledTransactions.forEach((transaction) => {
      const changeAmount = transaction[Meta.COLUMNS.CHANGE_AMOUNT];
      const transactionDate = transaction[Meta.COLUMNS.DATE];

      if (Math.abs(changeAmount) > 1) {
        const formattedDaySelected = getFormattedDate(
          new Date(transactionDate),
          "GMT+1",
          "dd/MM/yyyy"
        );

        // Use a helper function for better readability
        const upcomingPayment = this._getPaymentDetails(
          formattedDaySelected,
          changeAmount,
          transaction,
          howManyDaysAhead
        );
        if (upcomingPayment) {
          upcomingPayments += upcomingPayment;
        }
      }
    });

    return upcomingPayments;
  }

  // Helper function to generate payment details
  _getPaymentDetails(
    formattedDaySelected: string,
    changeAmount: number,
    transaction: string[],
    howManyDaysAhead: number
  ) {
    const { first, iterator: days } = setupDaysIterator(getNewDate());
    let day = first;

    for (let index = 0; index <= howManyDaysAhead; index++) {
      if (formattedDaySelected === day.day) {
        // Generate payment detail string
        return `\t${getOrdinalDate(day.date)} ${getAmountAsGBP(
          changeAmount
        )} from ${transaction[Meta.COLUMNS.FROM_ACCOUNT]} by ${
          transaction[Meta.COLUMNS.PAYMENT_TYPE]
        } ${transaction[Meta.COLUMNS.DESCRIPTION]}\n`;
      }
      day = days.next();
    }

    return null;
  }
}
