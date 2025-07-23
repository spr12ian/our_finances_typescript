/// <reference types="google-apps-script" />

import { BankAccounts } from "./BankAccounts";
import { BudgetAnnualTransactions } from "./BudgetAnnualTransactions";
import { BudgetMonthlyTransactions } from "./BudgetMonthlyTransactions";
import { BudgetWeeklyTransactions } from "./BudgetWeeklyTransactions";
import { DescriptionReplacements } from "./DescriptionReplacements";
import { Spreadsheet } from "./Spreadsheet";
import { TransactionsCategories } from "./TransactionsCategories";

export function GAS_dailySorts() {
  const sheetsToSort = [
    BankAccounts.SHEET.NAME,
    BudgetAnnualTransactions.SHEET.NAME,
    BudgetMonthlyTransactions.SHEET.NAME,
    BudgetWeeklyTransactions.SHEET.NAME,
    DescriptionReplacements.SHEET.NAME,
    TransactionsCategories.SHEET.NAME,
  ];
  const spreadsheet = Spreadsheet.getActive();
  sheetsToSort.forEach((sheetName) => {
    const sheet = spreadsheet.getSheet(sheetName);
    if (sheet) {
      sheet.sortByFirstColumnOmittingHeader();
    } else {
      throw new Error(`${sheetName} not found`);
    }
  });
}
