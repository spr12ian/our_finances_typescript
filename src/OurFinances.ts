/// <reference types="google-apps-script" />
import { AccountSheet } from "./AccountSheet";
import { BankAccounts } from "./BankAccounts";
import { BankDebitsDue } from "./BankDebitsDue";
import { BudgetAdhocTransactions } from "./BudgetAdhocTransactions";
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { BudgetMonthlyTransactions } from "./BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "./BudgetWeeklyTransactions";
import { CheckFixedAmounts } from "./CheckFixedAmounts";
import { Transactions } from "./Transactions";
import { Spreadsheet } from "./Spreadsheet";
export class OurFinances {
  private _bankAccounts?: BankAccounts;
  private _bankDebitsDue?: BankDebitsDue;
  private _budgetAnnualTransactions?: BudgetAnnualTransactions;
  private _budgetAdhocTransactions?: BudgetAdhocTransactions;
  private _budgetMonthlyTransactions?: BudgetMonthlyTransactions;
  private _budgetWeeklyTransactions?: BudgetWeeklyTransactions;
  private _checkFixedAmounts?: CheckFixedAmounts;
  private _transactions?: Transactions;
  private _howManyDaysAhead?: number;

  constructor(private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()){}
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
      this._budgetAdhocTransactions = new BudgetAdhocTransactions(
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
    return this.checkFixedAmounts.getMismatchMessages();
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

  mergeTransactions() {
    const transactions = new Transactions();
    const transactionsBuilder = new TransactionsBuilder();
    transactionsBuilder.copyIfSheetExists();
    const transactionFormulas = transactionsBuilder.getTransactionFormulas();

    transactions.updateBuilderFormulas(transactionFormulas);

    transactions.activate();
  }

  showAllAccounts() {
    this.bankAccounts.showAll();
  }
}
