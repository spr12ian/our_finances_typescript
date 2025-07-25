/// <reference types="google-apps-script" />
import { getFormattedDate, getNewDate, getOrdinalDate, setupDaysIterator } from "./DateUtils";
import { getAmountAsGBP } from "./MoneyUtils";
import type { Sheet } from "./Sheet";
import type { Spreadsheet } from "./Spreadsheet";

export class BudgetWeeklyTransactions {
  private sheet: Sheet;
  static get COL_DATE() {
    return 0;
  }
  static get COL_DEBIT_AMOUNT() {
    return 3;
  }
  static get COL_DESCRIPTION() {
    return 1;
  }
  static get COL_FROM_ACCOUNT() {
    return 6;
  }
  static get COL_PAYMENT_TYPE() {
    return 15;
  }

  static get SHEET() {
    return {
      NAME: "Budget monthly transactions",
    };
  }
  constructor(spreadsheet: Spreadsheet) {
    this.sheet = spreadsheet.getSheet("Budget weekly transactions");
  }

  getScheduledTransactions() {
    const values = this.sheet.getDataRange().getValues();
    // Lose the header row
    return values.slice(1);
  }

  getUpcomingDebits(howManyDaysAhead:number) {
    let upcomingPayments = "";
    const today = getNewDate();

    const scheduledTransactions = this.getScheduledTransactions();

    scheduledTransactions.forEach((transaction) => {
      if (
        Math.abs(transaction[BudgetWeeklyTransactions.COL_DEBIT_AMOUNT]) > 1
      ) {
        const daySelected = transaction[BudgetWeeklyTransactions.COL_DATE];

        const formattedDaySelected = getFormattedDate(
          new Date(daySelected),
          "GMT+1",
          "dd/MM/yyyy"
        );

        // Reset the day iterator
        const { first, iterator: days } = setupDaysIterator(today);
        let day = first;
        for (let index = 0; index <= howManyDaysAhead; index++) {
          const dayDay = day.day;

          if (formattedDaySelected === dayDay) {
            upcomingPayments += `\t${getOrdinalDate(day.date)}`;
            upcomingPayments += ` ${getAmountAsGBP(
              transaction[BudgetWeeklyTransactions.COL_DEBIT_AMOUNT]
            )}`;
            upcomingPayments += ` from`;
            upcomingPayments += ` ${
              transaction[BudgetWeeklyTransactions.COL_FROM_ACCOUNT]
            }`;
            upcomingPayments += ` by ${
              transaction[BudgetWeeklyTransactions.COL_PAYMENT_TYPE]
            }`;
            upcomingPayments += ` ${
              transaction[BudgetWeeklyTransactions.COL_DESCRIPTION]
            }\n`;
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
