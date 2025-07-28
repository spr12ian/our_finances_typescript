/// <reference types="google-apps-script" />
import { AccountSheet } from "./AccountSheet";
import { BankAccounts } from "./BankAccounts";
import { BankDebitsDue } from "./BankDebitsDue";
import { BudgetAdHocTransactions } from "./BudgetAdHocTransactions";
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { BudgetMonthlyTransactions } from "./BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "./BudgetWeeklyTransactions";
import { CheckFixedAmounts } from "./CheckFixedAmounts";
import {
  MetaAccountsData,
  MetaBankAccounts,
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
  MetaBudgetMonthlyTransactions,
  MetaBudgetWeeklyTransactions,
  MetaDescriptionReplacements,
  MetaTransactionCategories,
} from "./constants";
import { getToday } from "./DateUtils";
import { sendMeEmail } from "./emailFunctions";
import { Spreadsheet } from "./Spreadsheet";
import { SpreadsheetSummary } from "./SpreadsheetSummary";
import { Transactions } from "./Transactions";
import { TransactionsBuilder } from "./TransactionsBuilder";
import {
  buildAccountsMenu_,
  buildGasMenu_,
  buildSectionsMenu_,
} from "./uiFunctions";
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
  private _spreadsheetSummary?: SpreadsheetSummary;
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

  get spreadsheetSummary() {
    if (typeof this._spreadsheetSummary === "undefined") {
      this._spreadsheetSummary = new SpreadsheetSummary(this.spreadsheet);
    }
    return this._spreadsheetSummary;
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

  copyKeys() {
    this.transactionsBuilder.copyIfSheetExists();
  }

  dailySorts() {
    const sheetsToSort = [
      MetaBankAccounts.SHEET.NAME,
      MetaBudgetAdHocTransactions.SHEET.NAME,
      MetaBudgetAnnualTransactions.SHEET.NAME,
      MetaBudgetMonthlyTransactions.SHEET.NAME,
      MetaBudgetWeeklyTransactions.SHEET.NAME,
      MetaDescriptionReplacements.SHEET.NAME,
      MetaTransactionCategories.SHEET.NAME,
    ];
    sheetsToSort.forEach((sheetName) => {
      const sheet = this.spreadsheet.getSheet(sheetName);
      if (sheet) {
        sheet.sortByFirstColumnOmittingHeader();
      }
    });
  }

  generateAccountsData() {
    const ss = SpreadsheetApp.getActive();
    const accountSheets = ss
      .getSheets()
      .filter((sheet) => sheet.getName().startsWith("_"));

    const EXCLUDED_SHEETS = new Set(["_SVI3BH", "_SVIIRF"]);

    const HEADER = [
      "Date",
      "Description",
      "Credit (£)",
      "Debit (£)",
      "Note",
      "CPTY",
      "Date CPTY",
      "Source",
    ];
    const START_ROW = 2; // Skip headers in each sheet
    const NUM_COLUMNS = 7;

    const allRows = [HEADER];

    for (const sheet of accountSheets) {
      const name = sheet.getName();
      console.log(`Processing sheet: ${name}`);

      if (EXCLUDED_SHEETS.has(name)) continue;

      const lastRow = sheet.getLastRow();
      if (lastRow < START_ROW) continue; // Skip empty sheets

      const data = sheet
        .getRange(START_ROW, 1, lastRow - 1, NUM_COLUMNS)
        .getValues();

      for (const row of data) {
        if (row.every((cell) => cell === "")) continue; // Skip empty rows
        allRows.push([...row, name]); // Append column with sheet name (Source)
      }
    }

    // Replace or create 'Accounts data'
    let targetSheet = ss.getSheetByName(MetaAccountsData.SHEET.NAME);
    if (!targetSheet) {
      targetSheet = ss.insertSheet(MetaAccountsData.SHEET.NAME);
    } else {
      targetSheet.clearContents();
    }

    targetSheet
      .getRange(1, 1, allRows.length, allRows[0].length)
      .setValues(allRows);
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
      const accountSheetNames: string[] =
        this.spreadsheetSummary.accountSheetNames;

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
