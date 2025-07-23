/// <reference types="google-apps-script" />
import { AccountSheet } from "./AccountSheet";
import { BankAccounts } from "./BankAccounts";
import { BankDebitsDue } from "./BankDebitsDue";
import { BudgetAdhocTransactions } from "./BudgetAdhocTransactions";
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { BudgetMonthlyTransactions } from "./BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "./BudgetWeeklyTransactions";
import { CheckFixedAmounts } from "./CheckFixedAmounts";
import { Spreadsheet } from "./Spreadsheet";
export class OurFinances {
  private _bankAccounts?: BankAccounts;
  private _bankDebitsDue?: BankDebitsDue;
  private _budgetAnnualTransactions?: BudgetAnnualTransactions;
  private _budgetAdhocTransactions?: BudgetAdhocTransactions;
  private _budgetMonthlyTransactions?: BudgetMonthlyTransactions;
  private _budgetWeeklyTransactions?: BudgetWeeklyTransactions;
  private _checkFixedAmounts?: CheckFixedAmounts;
  private _howManyDaysAhead?: number;
  private _spreadsheet: Spreadsheet = Spreadsheet.getActive();

  get bankAccounts() {
    if (typeof this._bankAccounts === "undefined") {
      this._bankAccounts = new BankAccounts(this._spreadsheet);
    }
    return this._bankAccounts;
  }

  get bankDebitsDue() {
    if (typeof this._bankDebitsDue === "undefined") {
      this._bankDebitsDue = new BankDebitsDue(this._spreadsheet);
    }
    return this._bankDebitsDue;
  }

  get budgetAdhocTransactions() {
    if (typeof this._budgetAdhocTransactions === "undefined") {
      this._budgetAdhocTransactions = new BudgetAdhocTransactions(
        this._spreadsheet
      );
    }
    return this._budgetAdhocTransactions;
  }

  get budgetAnnualTransactions() {
    if (typeof this._budgetAnnualTransactions === "undefined") {
      this._budgetAnnualTransactions = new BudgetAnnualTransactions(
        this._spreadsheet
      );
    }
    return this._budgetAnnualTransactions;
  }

  get budgetMonthlyTransactions() {
    if (typeof this._budgetMonthlyTransactions === "undefined") {
      this._budgetMonthlyTransactions = new BudgetMonthlyTransactions(
        this._spreadsheet
      );
    }
    return this._budgetMonthlyTransactions;
  }

  get budgetWeeklyTransactions() {
    if (typeof this._budgetWeeklyTransactions === "undefined") {
      this._budgetWeeklyTransactions = new BudgetWeeklyTransactions(
        this._spreadsheet
      );
    }
    return this._budgetWeeklyTransactions;
  }

  get checkFixedAmounts() {
    if (typeof this._checkFixedAmounts === "undefined") {
      this._checkFixedAmounts = new CheckFixedAmounts(this._spreadsheet);
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
    return this._spreadsheet.url;
  }

  applyDescriptionReplacements() {
    const activeSheet = this._spreadsheet.activeSheet;
    const accountSheet = new AccountSheet(activeSheet);
    if (accountSheet) {
      accountSheet.applyDescriptionReplacements();
    }
  }

  showAllAccounts() {
    this.bankAccounts.showAll();
  }
}
