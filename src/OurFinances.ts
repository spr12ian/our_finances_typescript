import { Spreadsheet } from "@domain";
import { FastLog } from "@logging/FastLog";
import { isAccountSheet } from "@sheets/accountSheetFunctions";
import { AccountSheet } from "@sheets/classes/AccountSheet";
import { BankAccounts } from "@sheets/classes/BankAccounts";
import { BankDebitsDue } from "@sheets/classes/BankDebitsDue";
import { BudgetAdHocTransactions } from "@sheets/classes/BudgetAdHocTransactions";
import { BudgetAnnualTransactions } from "@sheets/classes/BudgetAnnualTransactions";
import { BudgetMonthlyTransactions } from "@sheets/classes/BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "@sheets/classes/BudgetWeeklyTransactions";
import { Dependencies } from "@sheets/classes/Dependencies";
import { TransactionCategories } from "@sheets/classes/TransactionCategories";
import { Transactions } from "@sheets/classes/Transactions";

export class OurFinances {
  #dependencies?: Dependencies;
  #bankAccounts?: BankAccounts;
  #bankDebitsDue?: BankDebitsDue;
  #budgetAnnualTransactions?: BudgetAnnualTransactions;
  #budgetAdhocTransactions?: BudgetAdHocTransactions;
  #budgetMonthlyTransactions?: BudgetMonthlyTransactions;
  #budgetWeeklyTransactions?: BudgetWeeklyTransactions;
  readonly #spreadsheet: Spreadsheet;
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

  get dependencies() {
    if (typeof this.#dependencies === "undefined") {
      this.#dependencies = new Dependencies(this.#spreadsheet);
    }
    return this.#dependencies;
  }

  get howManyDaysAhead() {
    if (typeof this.#howManyDaysAhead === "undefined") {
      this.#howManyDaysAhead = this.bankDebitsDue.howManyDaysAhead;
    }
    return this.#howManyDaysAhead;
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

  get url(): string {
    return this.#spreadsheet.url;
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

  updateTransactions() {
    this.transactions.update();
  }
}
