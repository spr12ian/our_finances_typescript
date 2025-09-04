/// <reference types="google-apps-script" />
import { MetaBudgetMonthlyTransactions as Meta } from "./constants";
import { getNewDate, getOrdinalDate, setupDaysIterator } from "./DateFunctions";
import { getAmountAsGBP } from "./MoneyUtils";
import { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
export class BudgetMonthlyTransactions {
  private readonly sheet: Sheet;
  constructor(private readonly spreadsheet: Spreadsheet) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  getScheduledTransactions() {
    const values = this.sheet.dataRange.getValues();
    // Lose the header row
    return values.slice(1);
  }

  getUpcomingDebits(howManyDaysAhead: number) {
    let upcomingPayments = "";
    const today = getNewDate();

    const scheduledTransactions = this.getScheduledTransactions();

    if (scheduledTransactions.length > 0) {
      upcomingPayments += `\nMonthly payment due:\n`;
      // Get the dates for the upcoming days
      const upcomingDays: any[] = [];
      const { first, iterator: days } = setupDaysIterator(today);
      let day = first;
      for (let index = 0; index <= howManyDaysAhead; index++) {
        upcomingDays.push(day);
        day = days.next();
      }

      scheduledTransactions.forEach((transaction) => {
        if (Math.abs(transaction[Meta.COLUMNS.DEBIT_AMOUNT]) > 1) {
          const transactionDate = new Date(transaction[Meta.COLUMNS.DATE]);

          upcomingDays.forEach((day) => {
            if (transactionDate.toDateString() === day.date.toDateString()) {
              upcomingPayments += `\t${getOrdinalDate(day.date)} `;
              upcomingPayments += `${getAmountAsGBP(
                transaction[Meta.COLUMNS.DEBIT_AMOUNT]
              )} from `;
              upcomingPayments += `${
                transaction[Meta.COLUMNS.FROM_ACCOUNT]
              } by ${transaction[Meta.COLUMNS.PAYMENT_TYPE]} `;
              upcomingPayments += `${transaction[Meta.COLUMNS.DESCRIPTION]}\n`;
            }
          });
        }
      });
    }

    return upcomingPayments;
  }
}
