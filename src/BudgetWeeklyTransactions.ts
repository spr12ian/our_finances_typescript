/// <reference types="google-apps-script" />
import type { Sheet, Spreadsheet } from "@domain";
import { MetaBudgetWeeklyTransactions as Meta } from "@lib/constants";
import {
  getFormattedDate,
  getNewDate,
  getOrdinalDateTZ,
  setupDaysIteratorTZ,
} from "./lib/dates";
import { getAmountAsGBP } from "./lib/money";

export class BudgetWeeklyTransactions {
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

    scheduledTransactions.forEach((transaction) => {
      if (Math.abs(transaction[Meta.COLUMNS.DEBIT_AMOUNT]) > 1) {
        const daySelected = transaction[Meta.COLUMNS.DATE];

        const formattedDaySelected = getFormattedDate(
          new Date(daySelected),
          "GMT+1",
          "dd/MM/yyyy"
        );

        // Reset the day iterator
        const { first, iterator: days } = setupDaysIteratorTZ(today);
        let day = first;
        for (let index = 0; index <= howManyDaysAhead; index++) {
          const dayDay = day.day;

          if (formattedDaySelected === dayDay) {
            upcomingPayments += `\t${getOrdinalDateTZ(day.date)}`;
            upcomingPayments += ` ${getAmountAsGBP(
              transaction[Meta.COLUMNS.DEBIT_AMOUNT]
            )}`;
            upcomingPayments += ` from`;
            upcomingPayments += ` ${transaction[Meta.COLUMNS.FROM_ACCOUNT]}`;
            upcomingPayments += ` by ${transaction[Meta.COLUMNS.PAYMENT_TYPE]}`;
            upcomingPayments += ` ${transaction[Meta.COLUMNS.DESCRIPTION]}\n`;
          }
          day = days.next();
        }
      }
    });

    if (upcomingPayments.length) {
      upcomingPayments = `\nWeekly payment due:\n${upcomingPayments}`;
    }

    return upcomingPayments;
  }
}
