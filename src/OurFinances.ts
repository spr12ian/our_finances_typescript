/// <reference types="google-apps-script" />
import { Spreadsheet } from "./Spreadsheet";
import { activeSpreadsheet } from "./context";
import { BankDebitsDue } from "./BankDebitsDue";
import { BudgetAdhocTransactions } from "./BudgetAdhocTransactions";
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { CheckFixedAmounts } from "./CheckFixedAmounts";
export class OurFinances {
  private spreadsheet: Spreadsheet;
  private _budgetAnnualTransactions?: BudgetAnnualTransactions;
  private _budgetAdhocTransactions ?: BudgetAdhocTransactions;
  private _howManyDaysAhead?:number;

  constructor() {
    this.spreadsheet = activeSpreadsheet;
  }

  getFixedAmountMismatches() {
    return this.checkFixedAmounts.getMismatchMessages();
  }

  getUpcomingDebits() {
    // Collect upcoming debits from different sources
    return [
      this.bankDebitsDue.getUpcomingDebits(),
      this.budgetAdhocTransactions.getUpcomingDebits(),
      this.budgetAnnualTransactions.getUpcomingDebits(),
      this.budgetMonthlyTransactions.getUpcomingDebits(),
      this.budgetWeeklyTransactions.getUpcomingDebits(),
    ];
  }

  get budgetAnnualTransactions() {
    if (typeof this._budgetAnnualTransactions === "undefined") {
      this._budgetAnnualTransactions = new BudgetAnnualTransactions(this);
    }
    return this._budgetAnnualTransactions;
  }

  get budgetAdhocTransactions() {
    if (typeof this._budgetAdhocTransactions === "undefined") {
      this._budgetAdhocTransactions = new BudgetAdhocTransactions(this);
    }
    return this._budgetAdhocTransactions;
  }

  get bankAccounts() {
    if (typeof this._bankAccounts === "undefined") {
      this._bankAccounts = new BankAccounts(this);
    }
    return this._bankAccounts;
  }

  get bankDebitsDue() {
    if (typeof this._bankDebitsDue === "undefined") {
      this._bankDebitsDue = new BankDebitsDue(this);
    }
    return this._bankDebitsDue;
  }

  get checkFixedAmounts() {
    if (typeof this._checkFixedAmounts === "undefined") {
      this._checkFixedAmounts = new CheckFixedAmounts(this);
    }
    return this._checkFixedAmounts;
  }

  get howManyDaysAhead() {
    if (typeof this._howManyDaysAhead === "undefined") {
      const sheetName = "Bank debits due";
      const sheet = this.getSheetByName(sheetName);
      const searchValue = "Look ahead";
      this._howManyDaysAhead = xLookup(searchValue, sheet, "F", "G");
    }
    return this._howManyDaysAhead;
  }

  get budgetMonthlyTransactions() {
    if (typeof this._budgetMonthlyTransactions === "undefined") {
      this._budgetMonthlyTransactions = new BudgetMonthlyTransactions(this);
    }
    return this._budgetMonthlyTransactions;
  }

  get budgetWeeklyTransactions() {
    if (typeof this._budgetWeeklyTransactions === "undefined") {
      this._budgetWeeklyTransactions = new BudgetWeeklyTransactions(this);
    }
    return this._budgetWeeklyTransactions;
  }

  getName() {
    return this.spreadsheet.getName();
  }

  getSheetByName(sheetName:string) {
    return this.spreadsheet.getSheetByName(sheetName);
  }

  showAllAccounts() {
    this.bankAccounts.showAll();
  }
}
