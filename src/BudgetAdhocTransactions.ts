/// <reference types="google-apps-script" />

export class BudgetAdhocTransactions {
  static get COL_CHANGE_AMOUNT() {
    return 3;
  }
  static get COL_DATE() {
    return 0;
  }
  static get COL_DESCRIPTION() {
    return 1;
  }
  static get COL_FROM_ACCOUNT() {
    return 6;
  }
  static get COL_PAYMENT_TYPE() {
    return 7;
  }

  constructor(ourFinances) {
    this.spreadsheet = ourFinances.spreadsheet;
    this.sheet = this.spreadsheet.getSheetByName("Budget ad hoc transactions");
    this.howManyDaysAhead = ourFinances.howManyDaysAhead;

    if (!this.sheet) {
      throw new Error(`Sheet "${this.getSheetName()}" not found.`);
    }
  }

  // Get all transactions from the sheet
  getScheduledTransactions() {
    return this.sheet.getDataRange().getValues();
  }

  // Main method to get upcoming debits
  getUpcomingDebits() {
    let upcomingPayments = "";

    // Fetch scheduled transactions and remove the header row
    const scheduledTransactions = this.getScheduledTransactions();
    scheduledTransactions.shift(); // Remove header row

    if (!scheduledTransactions.length) return upcomingPayments;

    upcomingPayments += "\nAd hoc payment(s) due:\n";

    // Iterate over transactions and filter valid ones
    scheduledTransactions.forEach((transaction) => {
      const changeAmount =
        transaction[BudgetAdhocTransactions.COL_CHANGE_AMOUNT];
      const transactionDate = transaction[BudgetAdhocTransactions.COL_DATE];

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
          transaction
        );
        if (upcomingPayment) {
          upcomingPayments += upcomingPayment;
        }
      }
    });

    return upcomingPayments;
  }

  // Helper function to generate payment details
  _getPaymentDetails(formattedDaySelected, changeAmount, transaction) {
    const { first, iterator: days } = setupDaysIterator(getNewDate());
    let day = first;

    for (let index = 0; index <= this.howManyDaysAhead; index++) {
      if (formattedDaySelected === day.day) {
        // Generate payment detail string
        return `\t${getOrdinalDate(day.date)} ${getAmountAsGBP(
          changeAmount
        )} from ${transaction[BudgetAdhocTransactions.COL_FROM_ACCOUNT]} by ${
          transaction[BudgetAdhocTransactions.COL_PAYMENT_TYPE]
        } ${transaction[BudgetAdhocTransactions.COL_DESCRIPTION]}\n`;
      }
      day = days.next();
    }

    return null;
  }
}
