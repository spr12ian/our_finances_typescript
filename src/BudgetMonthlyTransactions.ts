/// <reference types="google-apps-script" />
import { getNewDate, getOrdinalDate, setupDaysIterator } from "./DateUtils";
import { getAmountAsGBP } from "./MoneyUtils";
import { Sheet } from './Sheet';
import type { Spreadsheet } from "./Spreadsheet"
export class BudgetMonthlyTransactions {
  private sheet:Sheet;
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
    return 9;
  }

  static get SHEET() {
    return {
      NAME: "Budget monthly transactions",
    };
  }
  constructor(spreadsheet: Spreadsheet) {
    this.sheet = spreadsheet.getSheet("Budget monthly transactions");

    if (!this.sheet) {
      throw new Error(`Sheet "${this.getSheetName()}" not found.`);
    }
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

    if (scheduledTransactions.length > 0) {
      upcomingPayments += `\nMonthly payment due:\n`;
      // Get the dates for the upcoming days
      const upcomingDays = [];
      const { first, iterator: days } = setupDaysIterator(today);
      let day = first;
      for (let index = 0; index <= howManyDaysAhead; index++) {
        upcomingDays.push(day);
        day = days.next();
      }

      scheduledTransactions.forEach((transaction) => {
        if (
          Math.abs(transaction[BudgetMonthlyTransactions.COL_DEBIT_AMOUNT]) > 1
        ) {
          const transactionDate = new Date(
            transaction[BudgetMonthlyTransactions.COL_DATE]
          );

          upcomingDays.forEach((day) => {
            if (transactionDate.toDateString() === day.date.toDateString()) {
              upcomingPayments += `\t${getOrdinalDate(day.date)} `;
              upcomingPayments += `${getAmountAsGBP(
                transaction[BudgetMonthlyTransactions.COL_DEBIT_AMOUNT]
              )} from `;
              upcomingPayments += `${
                transaction[BudgetMonthlyTransactions.COL_FROM_ACCOUNT]
              } by ${transaction[BudgetMonthlyTransactions.COL_PAYMENT_TYPE]} `;
              upcomingPayments += `${
                transaction[BudgetMonthlyTransactions.COL_DESCRIPTION]
              }\n`;
            }
          });
        }
      });
    }

    return upcomingPayments;
  }
}
