/// <reference types="google-apps-script" />
import { AccountSheet } from "./AccountSheet";
import { BankAccounts } from "./BankAccounts";
import { BankDebitsDue } from "./BankDebitsDue";
import { BudgetAdHocTransactions } from "./BudgetAdHocTransactions";
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { BudgetMonthlyTransactions } from "./BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "./BudgetWeeklyTransactions";
import { CheckFixedAmounts } from "./CheckFixedAmounts";
import { getToday } from "./DateUtils";
import { MetaBankAccounts } from "./constants";
import { Spreadsheet } from "./Spreadsheet";
import { Transactions } from "./Transactions";
import { TransactionsBuilder } from "./TransactionsBuilder";
import { sendMeEmail } from "./functions";
import { MetaBudgetAdHocTransactions } from './constants';
const logTiming = <T>(label: string, fn: () => T): T => {
  const t0 = Date.now();
  const result = fn();
  console.log(`${label}: ${Date.now() - t0}ms`);
  return result;
};
export class OurFinances {
  private _bankAccounts?: BankAccounts;
  private _bankDebitsDue?: BankDebitsDue;
  private _budgetAnnualTransactions?: BudgetAnnualTransactions;
  private _budgetAdhocTransactions?: BudgetAdHocTransactions;
  private _budgetMonthlyTransactions?: BudgetMonthlyTransactions;
  private _budgetWeeklyTransactions?: BudgetWeeklyTransactions;
  private _checkFixedAmounts?: CheckFixedAmounts;
  private _transactions?: Transactions;
  private _transactionsBuilder?: TransactionsBuilder;
  private _howManyDaysAhead?: number;

  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {}
  get bankAccounts() {
    if (typeof this._bankAccounts === "undefined") {
      this._bankAccounts = new BankAccounts(this.spreadsheet);
    }
    return this._bankAccounts;
  }

  get bankDebitsDue() {
    if (typeof this._bankDebitsDue === "undefined") {
      this._bankDebitsDue = new BankDebitsDue(this.spreadsheet);
    }
    return this._bankDebitsDue;
  }

  get budgetAdhocTransactions() {
    if (typeof this._budgetAdhocTransactions === "undefined") {
      this._budgetAdhocTransactions = new BudgetAdHocTransactions(
        this.spreadsheet
      );
    }
    return this._budgetAdhocTransactions;
  }

  get budgetAnnualTransactions() {
    if (typeof this._budgetAnnualTransactions === "undefined") {
      this._budgetAnnualTransactions = new BudgetAnnualTransactions(
        this.spreadsheet
      );
    }
    return this._budgetAnnualTransactions;
  }

  get budgetMonthlyTransactions() {
    if (typeof this._budgetMonthlyTransactions === "undefined") {
      this._budgetMonthlyTransactions = new BudgetMonthlyTransactions(
        this.spreadsheet
      );
    }
    return this._budgetMonthlyTransactions;
  }

  get budgetWeeklyTransactions() {
    if (typeof this._budgetWeeklyTransactions === "undefined") {
      this._budgetWeeklyTransactions = new BudgetWeeklyTransactions(
        this.spreadsheet
      );
    }
    return this._budgetWeeklyTransactions;
  }

  get checkFixedAmounts() {
    if (typeof this._checkFixedAmounts === "undefined") {
      this._checkFixedAmounts = new CheckFixedAmounts(this.spreadsheet);
    }
    return this._checkFixedAmounts;
  }

  get fixedAmountMismatches() {
    return this.checkFixedAmounts.mismatchMessages;
  }

  get howManyDaysAhead() {
    if (typeof this._howManyDaysAhead === "undefined") {
      this._howManyDaysAhead = this.bankDebitsDue.howManyDaysAhead;
    }
    return this._howManyDaysAhead;
  }

  get transactions() {
    if (typeof this._transactions === "undefined") {
      this._transactions = new Transactions(this.spreadsheet);
    }
    return this._transactions;
  }

  get transactionsBuilder() {
    if (typeof this._transactionsBuilder === "undefined") {
      this._transactionsBuilder = new TransactionsBuilder(this.spreadsheet);
    }
    return this._transactionsBuilder;
  }

  get upcomingDebits() {
    const howManyDaysAhead = this.bankDebitsDue.howManyDaysAhead;
    // Collect upcoming debits from different sources
    return [
      this.bankDebitsDue.getUpcomingDebits(howManyDaysAhead),
      this.budgetAdhocTransactions.getUpcomingDebits(howManyDaysAhead),
      this.budgetAnnualTransactions.getUpcomingDebits(howManyDaysAhead),
      this.budgetMonthlyTransactions.getUpcomingDebits(howManyDaysAhead),
      this.budgetWeeklyTransactions.getUpcomingDebits(howManyDaysAhead),
    ];
  }

  get url(): string {
    return this.spreadsheet.url;
  }

  applyDescriptionReplacements() {
    const activeSheet = this.spreadsheet.activeSheet;
    const accountSheet = new AccountSheet(activeSheet);
    if (accountSheet) {
      accountSheet.applyDescriptionReplacements();
    }
  }

  dailySorts() {
    const sheetsToSort = [
      MetaBankAccounts.SHEET.NAME,
      MetaBudgetAdHocTransactions.SHEET.NAME,
      MetaBudgetAnnualTransactions.SHEET.NAME,
      MetaBudgetMonthlyTransactions.SHEET.NAME,
      MetaBudgetWeeklyTransactions.SHEET.NAME,
      MetaDescriptionReplacements.SHEET.NAME,
      MetaTransactionsCategories.SHEET.NAME,
    ];
    sheetsToSort.forEach((sheetName) => {
      const sheet = this.spreadsheet.getSheet(sheetName);
      if (sheet) {
        sheet.sortByFirstColumnOmittingHeader();
      }
    });
  }

  goToSheet(sheetName: string) {
    const sheet = this.spreadsheet.getSheet(sheetName);

    // Check if the sheet exists before trying to activate it.
    if (sheet) {
      sheet.activate();
    }
  }

  mergeTransactions() {
    const transactions = this.transactions;
    const transactionsBuilder = this.transactionsBuilder;
    transactionsBuilder.copyIfSheetExists();
    const transactionFormulas = transactionsBuilder.getTransactionFormulas();

    transactions.updateBuilderFormulas(transactionFormulas);

    transactions.activate();
  }

  onOpen(): void {
    try {
      const ui = SpreadsheetApp.getUi();

      const accountSheetNames = getSheetNamesByType("account"); // now safe
      logTiming("Accounts menu", () =>
        buildAccountsMenu_(ui, accountSheetNames)
      );
      logTiming("GAS menu", () => buildGasMenu_(ui));
      logTiming("Sections menu", () => buildSectionsMenu_(ui));
    } catch (err) {
      console.error("onOpen error:", err);
    }
  }

  sendDailyEmail(): void {
    const fixedAmountMismatches = this.fixedAmountMismatches;
    const upcomingDebits = this.upcomingDebits;

    const subject = `Our finances daily email: ${getToday()}`;

    // Initialize the email body
    let emailBody = ``;

    if (fixedAmountMismatches.length > 0) {
      emailBody += `Fixed amount mismatches\n`;
      // Concatenate the fixedAmountMismatches into the email body
      emailBody += fixedAmountMismatches.join("\n");
      emailBody += `\n\n`;
    }

    if (upcomingDebits.length) {
      emailBody += `Upcoming debits\n`;
      // Concatenate the debits into the email body
      emailBody += upcomingDebits.join("\n");
      emailBody += `\n\n`;
    }

    // Append the spreadsheet URL
    emailBody += `\n\nSent from (sendDailyEmail): ${this.url}\n`;

    // Send the email
    sendMeEmail(subject, emailBody);
  }

  showAllAccounts() {
    this.bankAccounts.showAll();
  }

  sortSheets() {
    this.spreadsheet.sortSheets();
  }
}
