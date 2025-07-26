import { logTime } from "./logTime";
import { MetaBudget } from "./constants";
import { MetaBudgetAdHocTransactions } from "./constants";
import { OurFinances } from "./OurFinances";

export function GAS_applyDescriptionReplacements() {
  new OurFinances().applyDescriptionReplacements();
}

export function GAS_budget() {
  new OurFinances().goToSheet(MetaBudget.SHEET.NAME);
}

export function GAS_budgetAdHocTransactions() {
  new OurFinances().goToSheet(MetaBudgetAdHocTransactions.SHEET.NAME);
}

export function GAS_categories() {
  new OurFinances().goToSheet("Categories");
}

export function GAS_dailySorts() {
  new OurFinances().dailySorts();
}
export function GAS_helloWorld(): void {
  logTime("Hello world!");
}
export function GAS_mergeTransactions() {
  new OurFinances().mergeTransactions();
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
