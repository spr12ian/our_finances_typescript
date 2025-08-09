import {
  MetaBudget,
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
  MetaCategories,
  MetaCategoryClash,
  MetaHMRC_B,
  MetaHMRC_S,
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

export function GAS_convertCurrentColumnToUppercase() {
  new OurFinances().convertCurrentColumnToUppercase();
}

export function GAS_dailySorts() {
  new OurFinances().dailySorts();
}

export function GAS_exportFormulasToDrive() {
  new OurFinances().exportFormulasToDrive();
}

export function GAS_fixSheet() {
  new OurFinances().fixSheet();
}

export function GAS_formatAccountSheet() {
  new OurFinances().formatAccountSheet();
}

export function GAS_goToSheet_AHALIF() {
  new OurFinances().goToSheet("_AHALIF");
}

export function GAS_goToSheetCategories() {
  new OurFinances().goToSheet(MetaCategories.SHEET.NAME);
}

export function GAS_goToSheetCategoryClash() {
  new OurFinances().goToSheet(MetaCategoryClash.SHEET.NAME);
}

export function GAS_goToSheet_CVITRA() {
  new OurFinances().goToSheet("_CVITRA");
}

export function GAS_goToSheet_SVI2TJ() {
  new OurFinances().goToSheet("_SVI2TJ");
}

export function GAS_goToSheet_SVIGBL() {
  new OurFinances().goToSheet("_SVIGBL");
}

export function GAS_goToSheet_SVIIRF() {
  new OurFinances().goToSheet("_SVIIRF");
}

export function GAS_goToSheetHMRC_B() {
  new OurFinances().goToSheet(MetaHMRC_B.SHEET.NAME);
}

export function GAS_goToSheetHMRC_S() {
  new OurFinances().goToSheet(MetaHMRC_S.SHEET.NAME);
}

export function GAS_goToSheetHMRCTransactionsSummary() {
  new OurFinances().goToSheet("HMRC Transactions Summary");
}

export function GAS_goToSheetLoanGlenburnie() {
  new OurFinances().goToSheet("Loan Glenburnie");
}

export function GAS_goToSheetPeople() {
  new OurFinances().goToSheet("People");
}

export function GAS_goToSheetSW183PTInventory() {
  new OurFinances().goToSheet("SW18 3PT inventory");
}

export function GAS_goToSheetTransactionCategories() {
  new OurFinances().goToSheet(MetaTransactionCategories.SHEET.NAME);
}

export function GAS_goToSheetUncategorisedByDate() {
  new OurFinances().goToSheet(MetaUncategorisedByDate.SHEET.NAME);
}

export function GAS_goToSheetXfersMismatch() {
  new OurFinances().goToSheet("Xfers mismatch");
}

export function GAS_goToSheetNotInTransactionCategories() {
  new OurFinances().goToSheet(MetaNotInTransactionCategories.SHEET.NAME);
}

export function GAS_goToSheetTransactionsByDate() {
  new OurFinances().goToSheet(MetaTransactionsByDate.SHEET.NAME);
}

export function GAS_helloWorld(): void {
  logTime("Hello world!");
}

export function GAS_monthlyUpdate() {
  new OurFinances().bankAccounts.showMonthly();
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

export function GAS_trimAllSheets() {
  new OurFinances().trimAllSheets();
}

export function GAS_trimSheet() {
  new OurFinances().trimSheet();
}

export function GAS_updateSpreadsheetSummary() {
  new OurFinances().updateSpreadsheetSummary();
}

export function GAS_updateTransactions() {
  new OurFinances().updateTransactions();
}

export function GAS_updateTransactionCategories() {
  new OurFinances().updateTransactionCategories();
}

export function GAS_validateAllMenuFunctionNames() {
  validateAllMenuFunctionNames();
}
