/// <reference types="google-apps-script" />
import { AccountBalances } from "./AccountBalances";
import { AccountSheet } from "./AccountSheet";
import { BankAccounts } from "./BankAccounts";
import { BankDebitsDue } from "./BankDebitsDue";
import { BudgetAdHocTransactions } from "./BudgetAdHocTransactions";
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { BudgetMonthlyTransactions } from "./BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "./BudgetWeeklyTransactions";
import { CheckFixedAmounts } from "./CheckFixedAmounts";
import { columnToLetter } from "./columnToLetter";
import {
  MetaAccountBalances,
  MetaBankAccounts,
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
  MetaBudgetMonthlyTransactions,
  MetaBudgetWeeklyTransactions,
  MetaDescriptionReplacements,
  MetaTransactionCategories,
} from "./constants";
import { getToday } from "./DateUtils";
import { Dependencies } from "./Dependencies";
import { outputToDrive } from "./driveFunctions";
import { sendMeEmail } from "./emailFunctions";
import { FastLog } from "./FastLog";
import { intersectsWatchedCols } from "./intersectsWatchedCols";
import { Spreadsheet } from "./Spreadsheet";
import { SpreadsheetSummary } from "./SpreadsheetSummary";
import { TransactionCategories } from "./TransactionCategories";
import { Transactions } from "./Transactions";
import {
  buildAccountsMenu_,
  buildGasMenu_,
  buildSectionsMenu_,
} from "./uiFunctions";

const logTiming = <T>(label: string, fn: () => T): T => {
  const t0 = Date.now();
  const result = fn();
  FastLog.log(`${label}: ${Date.now() - t0}ms`);
  return result;
};
export class OurFinances {
  #dependencies?: Dependencies;
  #accountBalances?: AccountBalances;
  #bankAccounts?: BankAccounts;
  #bankDebitsDue?: BankDebitsDue;
  #budgetAnnualTransactions?: BudgetAnnualTransactions;
  #budgetAdhocTransactions?: BudgetAdHocTransactions;
  #budgetMonthlyTransactions?: BudgetMonthlyTransactions;
  #budgetWeeklyTransactions?: BudgetWeeklyTransactions;
  #checkFixedAmounts?: CheckFixedAmounts;
  readonly #spreadsheet: Spreadsheet;
  #spreadsheetSummary?: SpreadsheetSummary;
  #transactionCategories?: TransactionCategories;
  #transactions?: Transactions;
  #howManyDaysAhead?: number;

  constructor(spreadsheet: Spreadsheet) {
    this.#spreadsheet = spreadsheet;
  }

  get accountBalances() {
    if (typeof this.#accountBalances === "undefined") {
      this.#accountBalances = new AccountBalances(this.#spreadsheet);
    }
    return this.#accountBalances;
  }

  get bankAccounts() {
    if (typeof this.#bankAccounts === "undefined") {
      this.#bankAccounts = new BankAccounts(this.#spreadsheet);
    }
    return this.#bankAccounts;
  }

  get bankDebitsDue() {
    if (typeof this.#bankDebitsDue === "undefined") {
      this.#bankDebitsDue = new BankDebitsDue(this.#spreadsheet);
    }
    return this.#bankDebitsDue;
  }

  get budgetAdhocTransactions() {
    if (typeof this.#budgetAdhocTransactions === "undefined") {
      this.#budgetAdhocTransactions = new BudgetAdHocTransactions(
        this.#spreadsheet
      );
    }
    return this.#budgetAdhocTransactions;
  }

  get budgetAnnualTransactions() {
    if (typeof this.#budgetAnnualTransactions === "undefined") {
      this.#budgetAnnualTransactions = new BudgetAnnualTransactions(
        this.#spreadsheet
      );
    }
    return this.#budgetAnnualTransactions;
  }

  get budgetMonthlyTransactions() {
    if (typeof this.#budgetMonthlyTransactions === "undefined") {
      this.#budgetMonthlyTransactions = new BudgetMonthlyTransactions(
        this.#spreadsheet
      );
    }
    return this.#budgetMonthlyTransactions;
  }

  get budgetWeeklyTransactions() {
    if (typeof this.#budgetWeeklyTransactions === "undefined") {
      this.#budgetWeeklyTransactions = new BudgetWeeklyTransactions(
        this.#spreadsheet
      );
    }
    return this.#budgetWeeklyTransactions;
  }

  get checkFixedAmounts() {
    if (typeof this.#checkFixedAmounts === "undefined") {
      this.#checkFixedAmounts = new CheckFixedAmounts(this.#spreadsheet);
    }
    return this.#checkFixedAmounts;
  }

  get dependencies() {
    if (typeof this.#dependencies === "undefined") {
      this.#dependencies = new Dependencies(this.#spreadsheet);
    }
    return this.#dependencies;
  }

  get fixedAmountMismatches() {
    return this.checkFixedAmounts.mismatchMessages;
  }

  get howManyDaysAhead() {
    if (typeof this.#howManyDaysAhead === "undefined") {
      this.#howManyDaysAhead = this.bankDebitsDue.howManyDaysAhead;
    }
    return this.#howManyDaysAhead;
  }

  get spreadsheetSummary() {
    if (typeof this.#spreadsheetSummary === "undefined") {
      this.#spreadsheetSummary = new SpreadsheetSummary(this.#spreadsheet);
    }
    return this.#spreadsheetSummary;
  }

  get transactionCategories() {
    if (typeof this.#transactionCategories === "undefined") {
      this.#transactionCategories = new TransactionCategories(
        this.#spreadsheet
      );
    }
    return this.#transactionCategories;
  }

  get transactions() {
    if (typeof this.#transactions === "undefined") {
      this.#transactions = new Transactions(this.#spreadsheet);
    }
    return this.#transactions;
  }

  get upcomingDebits() {
    const howManyDaysAhead = this.bankDebitsDue.howManyDaysAhead;
    // Collect upcoming debits from different sources
    return [
      this.bankDebitsDue.getUpcomingDebits(),
      this.budgetAdhocTransactions.getUpcomingDebits(howManyDaysAhead),
      this.budgetAnnualTransactions.getUpcomingDebits(howManyDaysAhead),
      this.budgetMonthlyTransactions.getUpcomingDebits(howManyDaysAhead),
      this.budgetWeeklyTransactions.getUpcomingDebits(howManyDaysAhead),
    ];
  }

  get url(): string {
    return this.#spreadsheet.url;
  }

  applyDescriptionReplacements() {
    const activeSheet = this.#spreadsheet.activeSheet;
    const accountSheet = new AccountSheet(activeSheet, this.#spreadsheet);
    if (accountSheet) {
      accountSheet.applyDescriptionReplacements();
    }
  }

  convertCurrentColumnToUppercase() {
    const gasSheet = this.#spreadsheet.activeSheet.raw;
    const activeRange = gasSheet.getActiveRange();
    if (!activeRange) {
      FastLog.log("No active range selected.");
      return;
    }
    const START_ROW = 2;
    const column = activeRange.getColumn();
    if (column < 1) {
      FastLog.log("No column selected.");
      return;
    }

    const lastRow = gasSheet.getLastRow();
    const numRows = lastRow + 1 - START_ROW;

    const range = gasSheet.getRange(START_ROW, column, numRows, 1);
    const values = range.getValues();
    const uppercasedValues = values.map((row) => [
      row[0].toString().toUpperCase(),
    ]);

    range.setValues(uppercasedValues);
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
      const sheet = this.#spreadsheet.getSheet(sheetName);
      if (sheet) {
        sheet.sortByFirstColumnOmittingHeader();
      }
    });
  }

  exportFormulasToDrive() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets().filter((s) => s.getName() > "BMONZO");
    const fileName = "FormulasExport.ts";
    let output = "";

    for (const sheet of sheets) {
      const formulas = sheet.getDataRange().getFormulas();
      const formulaConfig = [];

      for (let r = 0; r < formulas.length; r++) {
        for (let c = 0; c < formulas[r].length; c++) {
          const f = formulas[r][c];
          if (f) {
            formulaConfig.push(
              `  { cell: "${columnToLetter(c + 1)}${
                r + 1
              }", formula: '${f.replace(/'/g, "\\'")}' },`
            );
          }
        }
      }

      if (formulaConfig.length > 0) {
        output += `// ---- ${sheet.getName()} ----\n`;
        output += `FORMULA_CONFIG: [\n${formulaConfig.join(
          "\n"
        )}\n] as { cell: string; formula: string }[],\n`;
        output += `SHEET: { NAME: "${sheet.getName()}", },\n\n`;
        FastLog.log(`// ---- ${sheet.getName()} ----\n`);
      }
    }

    // Create file in Drive
    outputToDrive(fileName, output);
  }

  fixAccountSheet() {
    FastLog.log(`Started OurFinances.fixAccountSheet`);

    const activeSheet = this.#spreadsheet.activeSheet;
    if (!activeSheet) {
      FastLog.log("No active sheet found.");
      return;
    }

    const accountSheet = new AccountSheet(activeSheet, this.#spreadsheet);
    accountSheet.fixSheet();

    FastLog.log(`Finished OurFinances.fixAccountSheet`);
  }

  fixSheet() {
    FastLog.log(`Started OurFinances.fixSheet`);

    const activeSheet = this.#spreadsheet.activeSheet;
    if (!activeSheet) {
      FastLog.log("No active sheet found.");
      return;
    }

    // Define a strongly typed mapping from sheet name to action
    const sheetActions: Record<string, () => void> = {
      [MetaAccountBalances.SHEET.NAME]: () => this.accountBalances.fixSheet(),
      // [MetaBankAccounts.SHEET.NAME]: () => this.bankAccounts.fixSheet(),
      // [MetaBudgetAdHocTransactions.SHEET.NAME]: () => this.budgetAdhocTransactions.fixSheet(),
      // [MetaBudgetAnnualTransactions.SHEET.NAME]: () => this.budgetAnnualTransactions.fixSheet(),
      // [MetaBudgetMonthlyTransactions.SHEET.NAME]: () => this.budgetMonthlyTransactions.fixSheet(),
      // [MetaBudgetWeeklyTransactions.SHEET.NAME]: () => this.budgetWeeklyTransactions.fixSheet(),
      // [MetaDescriptionReplacements.SHEET.NAME]: () => this.descriptionReplacements.fixSheet(),
      // [MetaTransactionCategories.SHEET.NAME]: () => this.transactionCategories.fixSheet(),
    } as const;

    // Look up the action based on sheet name
    const action = sheetActions[activeSheet.name as keyof typeof sheetActions];

    if (action) {
      action();
    } else {
      if (activeSheet.name.startsWith("_")) {
        FastLog.log(`Sheet ${activeSheet.name} is an account sheet.`);
        this.fixAccountSheet();
      } else {
        activeSheet.fixSheet();
      }
    }
    FastLog.log(`Finished OurFinances.fixSheet`);
  }

  formatAccountSheet() {
    const activeSheet = this.#spreadsheet.activeSheet;

    if (!activeSheet) {
      return;
    }

    const accountSheet = new AccountSheet(activeSheet, this.#spreadsheet);
    accountSheet.formatSheet();
  }

  goToSheet(sheetName: string) {
    const sheet = this.#spreadsheet.getSheet(sheetName);

    // Check if the sheet exists before trying to activate it.
    if (sheet) {
      sheet.activate();
    }
  }

  onChange(e: GoogleAppsScript.Events.SheetsOnChange): void {
    FastLog.log(`Started OurFinances.onChange`);
    FastLog.log(`Change type: ${e.changeType}`);
    if (e.changeType === "REMOVE_ROW") {
      FastLog.log(`Row removed`);
      this.updateBalanceValues();
    }

    FastLog.log(`Finished OurFinances.onChange`);
  }

  onEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
    FastLog.log(`Started OurFinances.onEdit`);
    const sheetName = e.source.getActiveSheet().getName();
    FastLog.log(`Edit made in sheet: ${sheetName}`);
    if (sheetName.startsWith("_")) {
      FastLog.log(`Sheet ${sheetName} is an account sheet.`);
      const range = e.range;
      if (range) {
        FastLog.log(`Edit made in range: ${range.getA1Notation()}`);
        const WATCHED_COLS = new Set<number>([3, 4, 8]); // Credit, Debit, or Balance

        if (!intersectsWatchedCols(range, WATCHED_COLS)) return;
        // Single-cell edit: we can test "actually changed"
        if (range.getNumRows() === 1 && range.getNumColumns() === 1) {
          // Note: clearing a cell -> e.value === undefined, e.oldValue is the previous value
          if (e.value === e.oldValue) return; // no-op edit
          this.updateBalanceValues();
          return;
        }
      }
    }

    FastLog.log(`Finished OurFinances.onEdit`);
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

    this.fixSheet();
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
    this.#spreadsheet.sortSheets();
  }

  trimAllSheets() {
    this.#spreadsheet.sheets.forEach((sheet) => {
      sheet.trimSheet();
    });
    FastLog.log("All sheets trimmed.");
  }

  trimSheet() {
    this.#spreadsheet.activeSheet.trimSheet();
  }

  updateAllDependencies() {
    const dependencies = new Dependencies(this.#spreadsheet);
    dependencies.updateAllDependencies();
  }

  updateBalanceValues() {
    FastLog.log(`Started OurFinances.updateBalanceValues`);

    const activeSheet = this.#spreadsheet.activeSheet;
    if (!activeSheet) {
      FastLog.log("No active sheet found.");
      return;
    }

    if (activeSheet.name.startsWith("_")) {
      FastLog.log(`Sheet ${activeSheet.name} is an account sheet.`);
      const accountSheet = new AccountSheet(activeSheet, this.#spreadsheet);
      accountSheet.updateBalanceValues();
    }

    FastLog.log(`Finished OurFinances.updateBalanceValues`);
  }

  updateSpreadsheetSummary() {
    this.spreadsheetSummary.update();
  }

  updateTransactions() {
    this.transactions.update();
  }

  updateTransactionCategories() {
    this.transactionCategories.update();
  }
}
