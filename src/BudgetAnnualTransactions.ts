/// <reference types="google-apps-script" />

import { OurFinances } from './OurFinances';
import { Sheet } from './Sheet';

class BudgetAnnualTransactions {
  static get COLUMNS() {
    return {
      DATE: 0,
      DESCRIPTION: 1,
      CHANGE_AMOUNT: 3,
      FROM_ACCOUNT: 4,
      PAYMENT_TYPE: 5
    }
  };
  static get SHEET() {
    return {
      NAME: 'Budget annual transactions'
    }
  }

  constructor(ourFinances) {
    this.spreadsheet = ourFinances.spreadsheet;
    this.sheet = this.spreadsheet.getSheetByName(BudgetAnnualTransactions.SHEET.NAME);
    this.howManyDaysAhead = ourFinances.howManyDaysAhead;

    if (!this.sheet) {
      throw new Error(`Sheet "${this.getSheetName()}" not found.`);
    }
  }

  // Get all scheduled transactions from the sheet
  getScheduledTransactions() {
    return this.sheet.getDataRange().getValues();
  }

  // Main method to get upcoming debits
  getUpcomingDebits() {
    const howManyDaysAhead = this.howManyDaysAhead;
    const today = getNewDate();
    let upcomingPayments = '';

    // Fetch scheduled transactions and remove the header row
    const scheduledTransactions = this.getScheduledTransactions();
    scheduledTransactions.shift(); // Remove header row

    if (!scheduledTransactions.length) return upcomingPayments;

    // Iterate over each transaction and filter the valid ones
    scheduledTransactions.forEach(transaction => {
      const {
        [BudgetAnnualTransactions.COLUMNS.DATE]: date,
        [BudgetAnnualTransactions.COLUMNS.CHANGE_AMOUNT]: changeAmount,
        [BudgetAnnualTransactions.COLUMNS.DESCRIPTION]: description,
        [BudgetAnnualTransactions.COLUMNS.FROM_ACCOUNT]: fromAccount,
        [BudgetAnnualTransactions.COLUMNS.PAYMENT_TYPE]: paymentType
      } = transaction;

      if (Math.abs(changeAmount) > 1) {
        const formattedDaySelected = getFormattedDate(new Date(date), "GMT+1", "dd/MM/yyyy");

        // Generate payment details if the date falls within the upcoming days
        const paymentDetails = this._generatePaymentDetails(formattedDaySelected, changeAmount, fromAccount, paymentType, description, today, howManyDaysAhead);
        if (paymentDetails) {
          upcomingPayments += paymentDetails;
        }
      }
    });

    if (upcomingPayments.length) {
      upcomingPayments = '\nAnnual payment(s) due:\n' + upcomingPayments;
    }

    return upcomingPayments;
  }

  // Helper method to generate payment details
  _generatePaymentDetails(formattedDaySelected, changeAmount, fromAccount, paymentType, description, today, howManyDaysAhead) {
    const { first, iterator: days } = setupDaysIterator(today);
    let day = first;

    for (let index = 0; index <= howManyDaysAhead; index++) {
      if (formattedDaySelected === day.day) {
        return `\t${getOrdinalDate(day.date)} ${getAmountAsGBP(changeAmount)} from ${fromAccount} by ${paymentType} ${description}\n`;
      }
      day = days.next();
    }

    return null;
  }
}
