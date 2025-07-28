import {
  MetaBudget,
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
  MetaCategories,
  MetaCategoryClash,
  MetaNotInTransactionCategories,
  MetaTransactionCategories,
  MetaTransactionsByDate,
  MetaUncategorisedByDate,
} from "./constants";
import { logTime } from "./logTime";
import { OurFinances } from "./OurFinances";
import { validateAllMenuFunctionNames } from "./validateAllMenuFunctionNames";

export function GAS_applyDescriptionReplacements() {
  new OurFinances().applyDescriptionReplacements();
}

export function GAS_budget() {
  new OurFinances().goToSheet(MetaBudget.SHEET.NAME);
}

export function GAS_budgetAdHocTransactions() {
  new OurFinances().goToSheet(MetaBudgetAdHocTransactions.SHEET.NAME);
}

export function GAS_budgetAnnualTransactions() {
  new OurFinances().goToSheet(MetaBudgetAnnualTransactions.SHEET.NAME);
}

export function GAS_categories() {
  new OurFinances().goToSheet("Categories");
}

export function GAS_copyKeys() {
  new OurFinances().copyKeys();
}
export function GAS_dailySorts() {
  new OurFinances().dailySorts();
}
export function GAS_generateAccountsData() {
  new OurFinances().generateAccountsData();
}

export function GAS_goToSheetCategories() {
  new OurFinances().goToSheet(MetaCategories.SHEET.NAME);
}

export function GAS_goToSheetCategoryClash() {
  new OurFinances().goToSheet(MetaCategoryClash.SHEET.NAME);
}

export function GAS_goToSheetTransactionCategories() {
  new OurFinances().goToSheet(MetaTransactionCategories.SHEET.NAME);
}

export function GAS_goToSheetTransactionsBuilder() {
  new OurFinances().goToSheet("Transactions builder");
}

export function GAS_goToSheetUncategorisedByDate() {
  new OurFinances().goToSheet(MetaUncategorisedByDate.SHEET.NAME);
}

export function GAS_helloWorld(): void {
  logTime("Hello world!");
}

export function GAS_mergeTransactions() {
  new OurFinances().mergeTransactions();
}

export function GAS_goToSheetNotInTransactionCategories() {
  new OurFinances().goToSheet(MetaNotInTransactionCategories.SHEET.NAME);
}

export function GAS_goToSheetTransactionsByDate() {
  new OurFinances().goToSheet(MetaTransactionsByDate.SHEET.NAME);
}

export function GAS_onOpen(): void {
  new OurFinances().onOpen();
}

export function GAS_sendDailyEmail() {
  new OurFinances().sendDailyEmail();
}

export function GAS_showAllAccounts() {
  new OurFinances().showAllAccounts();
}

export function GAS_sortSheets() {
  new OurFinances().sortSheets();
}

export function GAS_validateAllMenuFunctionNames() {
  validateAllMenuFunctionNames();
}
