import { Spreadsheet } from "@domain";
import {
  MetaBankAccounts,
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
  MetaBudgetMonthlyTransactions,
  MetaBudgetWeeklyTransactions,
  MetaDescriptionReplacements,
  MetaTransactionCategories,
} from "@lib/constants";
import {
  htmlHorizontalRule,
  toHtmlH1,
  toHtmlH2,
  toHtmlH3,
  toHtmlParagraph,
} from "@lib/html/htmlFunctions";
import { renderBankDebitsDueSummaryHtml } from "@lib/html/renderBankDebitsDueSummaryHtml";
import { renderUpcomingDebitsAsHtmlTable } from "@lib/html/renderUpcomingDebitsAsHtmlTable";
import { FastLog } from "@logging/FastLog";
import type { UpcomingDebit } from "@sheets/budgetTypes";
import { BudgetAnnualTransactions } from "@sheets/classes/BudgetAnnualTransactions";
import { Dependencies } from "@sheets/classes/Dependencies";
import { SpreadsheetSummary } from "@sheets/classes/SpreadsheetSummary";
import { isAccountSheet } from "./features/sheets/accountSheetFunctions";
import { AccountSheet } from "./features/sheets/classes/AccountSheet";
import { BankAccounts } from "./features/sheets/classes/BankAccounts";
import { BankDebitsDue } from "./features/sheets/classes/BankDebitsDue";
import { BudgetAdHocTransactions } from "./features/sheets/classes/BudgetAdHocTransactions";
import { BudgetMonthlyTransactions } from "./features/sheets/classes/BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "./features/sheets/classes/BudgetWeeklyTransactions";
import { CheckFixedAmounts } from "./features/sheets/classes/CheckFixedAmounts";
import { TransactionCategories } from "./features/sheets/classes/TransactionCategories";
import { Transactions } from "./features/sheets/classes/Transactions";
import { formatLondonDate } from "./lib/dates";
import { sendMeHtmlEmail } from "./lib/google/email";

export class OurFinances {
  #dependencies?: Dependencies;
  // #accountBalances?: AccountBalances;
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

  get upcomingDebits(): UpcomingDebit[] {
    const howManyDaysAhead = this.bankDebitsDue.howManyDaysAhead;
    // Collect upcoming debits from different sources
    return [
      {
        section: "Ad hoc",
        rows: this.budgetAdhocTransactions.getUpcomingDebits(howManyDaysAhead),
      },
      {
        section: "Annual",
        rows: this.budgetAnnualTransactions.getUpcomingDebits(howManyDaysAhead),
      },
      {
        section: "Monthly",
        rows: this.budgetMonthlyTransactions.getUpcomingDebits(
          howManyDaysAhead
        ),
      },
      {
        section: "Weekly",
        rows: this.budgetWeeklyTransactions.getUpcomingDebits(howManyDaysAhead),
      },
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

  onChange(e: GoogleAppsScript.Events.SheetsOnChange): void {
    FastLog.log(`Started OurFinances.onChange`);
    const ignored = new Set([
      "FORMAT",
      // add others you don't need
    ]);

    if (!ignored.has(e.changeType as string)) {
      switch (e.changeType) {
        case "REMOVE_ROW":
          FastLog.log(`Row removed`);
          this.updateAccountSheetBalances();
          break;
        default:
          FastLog.log(`Unhandled change event: ${JSON.stringify(e, null, 2)}`);
      }
    }

    FastLog.log(`Finished OurFinances.onChange`);
  }

  sendDailyHtmlEmail(): void {
    const fixedAmountMismatches = this.fixedAmountMismatches;
    const upcomingDebits = this.upcomingDebits;

    const subject = `Our finances daily email: ${formatLondonDate(new Date())}`;

    // Build array of lines first
    const lines: string[] = [];

    lines.push(toHtmlH1(subject));

    if (fixedAmountMismatches.length > 0) {
      lines.push(toHtmlH3("Fixed amount mismatches"));
      for (const mismatch of fixedAmountMismatches) {
        lines.push(mismatch);
      }
    }

    if (upcomingDebits.length > 0) {
      lines.push(toHtmlH2(toHtmlH2("Upcoming debits")));
      lines.push(
        renderBankDebitsDueSummaryHtml(
          this.bankDebitsDue.getUpcomingDebitsSummary()
        )
      );
      for (const debits of upcomingDebits) {
        if (debits.rows.length) {
          lines.push(toHtmlH3(debits.section));
          lines.push(renderUpcomingDebitsAsHtmlTable(debits.rows));
        }
      }
    }

    lines.push(htmlHorizontalRule());

    // Add footer with spreadsheet URL
    lines.push(`Sent from (sendDailyHtmlEmail): ${this.url}`);

    // Generate HTML body: wrap each line in <p>
    const htmlBody = lines.map((line) => toHtmlParagraph(line)).join("");

    // Send email
    sendMeHtmlEmail(subject, htmlBody);
  }

  showAllAccounts() {
    this.bankAccounts.showAllAccounts();
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

  updateAllDependencies() {
    const dependencies = new Dependencies(this.#spreadsheet);
    dependencies.updateAllDependencies();
  }

  updateAccountSheetBalances(rowEdited?: number) {
    FastLog.log(`Started OurFinances.updateAccountSheetBalances`);

    const activeSheet = this.#spreadsheet.activeSheet;
    if (!activeSheet) {
      FastLog.log("No active sheet found.");
      return;
    }

    if (isAccountSheet(activeSheet)) {
      FastLog.log(`Sheet ${activeSheet.name} is an account sheet.`);
      const accountSheet = new AccountSheet(activeSheet, this.#spreadsheet);
      accountSheet.updateAccountSheetBalances(rowEdited);
    }

    FastLog.log(`Finished OurFinances.updateAccountSheetBalances`);
  }

  updateSpreadsheetSummary() {
    this.spreadsheetSummary.update();
  }

  updateTransactions() {
    this.transactions.update();
  }
}
