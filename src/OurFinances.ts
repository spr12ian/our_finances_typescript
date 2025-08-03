/// <reference types="google-apps-script" />
import { AccountBalances } from "./AccountBalances";
import { AccountsData } from "./AccountsData";
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
import { outputToDrive } from "./driveFunctions";
import { sendMeEmail } from "./emailFunctions";
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
  console.log(`${label}: ${Date.now() - t0}ms`);
  return result;
};
export class OurFinances {
  private _accountBalances?: AccountBalances;
  private _accountsData?: AccountsData;
  private _bankAccounts?: BankAccounts;
  private _bankDebitsDue?: BankDebitsDue;
  private _budgetAnnualTransactions?: BudgetAnnualTransactions;
  private _budgetAdhocTransactions?: BudgetAdHocTransactions;
  private _budgetMonthlyTransactions?: BudgetMonthlyTransactions;
  private _budgetWeeklyTransactions?: BudgetWeeklyTransactions;
  private _checkFixedAmounts?: CheckFixedAmounts;
  private _spreadsheetSummary?: SpreadsheetSummary;
  private _transactionCategories?: TransactionCategories;
  private _transactions?: Transactions;
  private _howManyDaysAhead?: number;

  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {}

  get accountBalances() {
    if (typeof this._accountBalances === "undefined") {
      this._accountBalances = new AccountBalances(this.spreadsheet);
    }
    return this._accountBalances;
  }

  get accountsData() {
    if (typeof this._accountsData === "undefined") {
      this._accountsData = new AccountsData(this.spreadsheet);
    }
    return this._accountsData;
  }

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

  get transactionCategories() {
    if (typeof this._transactionCategories === "undefined") {
      this._transactionCategories = new TransactionCategories(this.spreadsheet);
    }
    return this._transactionCategories;
  }

  get transactions() {
    if (typeof this._transactions === "undefined") {
      this._transactions = new Transactions(this.spreadsheet);
    }
    return this._transactions;
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
      MetaTransactionCategories.SHEET.NAME,
    ];
    sheetsToSort.forEach((sheetName) => {
      const sheet = this.spreadsheet.getSheet(sheetName);
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
        Logger.log(`// ---- ${sheet.getName()} ----\n`);
      }
    }

    // Create file in Drive
    outputToDrive(fileName, output);
  }

  fixSheet() {
    const activeSheet = this.spreadsheet.activeSheet;
    if (!activeSheet) {
      Logger.log("No active sheet found.");
      return;
    }

    Logger.log(`Checking activeSheet: ${activeSheet.name}`);

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
      activeSheet.fixSheet();
    }

    activeSheet.trimSheet();
    Spreadsheet.alert(`Sheet ${activeSheet.name} checked and trimmed.`);
  }

  formatAccountSheet() {
    const activeSheet = this.spreadsheet.activeSheet;

    if (!activeSheet) {
      return;
    }

    const accountSheet = new AccountSheet(activeSheet);
    accountSheet.formatSheet();
  }

  goToSheet(sheetName: string) {
    const sheet = this.spreadsheet.getSheet(sheetName);

    // Check if the sheet exists before trying to activate it.
    if (sheet) {
      sheet.activate();
    }
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

  trimAllSheets() {
    this.spreadsheet.sheets.forEach((sheet) => {
      sheet.trimSheet();
    });
    Logger.log("All sheets trimmed.");
  }

  trimSheet() {
    this.spreadsheet.activeSheet.trimSheet();
  }

  updateAccountsData() {
    this.accountsData.update();
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

  validateAccountsData() {
    this.accountsData.validate();
  }
}
