import {
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
} from "@lib/constants";

export const accountSheetMenuItems: [string, string][] = [
  ["Apply description replacements", "applyDescriptionReplacements"],
  ["Convert current column to uppercase", "convertCurrentColumnToUppercase"],
  ["Update balance values", "updateAccountSheetBalances"],
];

export const analyzeTransactionsMenuItems: [string, string][] = [
  ["Not in transaction categories", "goToSheetNotInTransactionCategories"],
  ["Uncategorised by date", "goToSheetUncategorisedByDate"],
  ["Category clash", "goToSheetCategoryClash"],
  ["Categories", "goToSheetCategories"],
  ["Transaction categories", "goToSheetTransactionCategories"],
];

export const bankAccountsSheetMenuItems: [string, string][] = [
  ["Show all accounts", "showAllAccounts"],
  ["Show daily accounts", "showDailyAccounts"],
  ["Show monthly accounts", "showMonthlyAccounts"],
  ["Show open accounts", "showOpenAccounts"],
];

export const budgetMenuItems: [string, string][] = [
  ["Budget", "budget"],
  [MetaBudgetAnnualTransactions.SHEET.NAME, "budgetAnnualTransactions"],
  ["Budget monthly transactions", "budgetMonthlyTransactions"],
  [MetaBudgetAdHocTransactions.SHEET.NAME, "budgetAdHocTransactions"],
  ["Budget predicted spend", "budgetPredictedSpend"],
  ["Budget weekly transactions", "budgetWeeklyTransactions"],
];

export const gasMenuItems: [string, string][] = [
  ["Balance sheet", "balanceSheet"],
  ["Check dependencies", "updateAllDependencies"],
  ["Sort sheet order", "sortSheets"],
  ["Trim all sheets", "trimAllSheets"],
  ["Update spreadsheet summary", "updateSpreadsheetSummary"],
  ["Validate all menu function names", "validateAllMenuFunctionNames"],
];

export const sheetMenuItems: [string, string][] = [
  ["Fix sheet", "fixSheet"],
  ["Format sheet", "formatSheet"],
  ["Trim sheet", "trimSheet"],
];

export const transactionsMenuItems: [string, string][] = [
  ["Transactions by date", "goToSheetTransactionsByDate"],
  ["Update 'Transactions'", "updateTransactions"],
];
