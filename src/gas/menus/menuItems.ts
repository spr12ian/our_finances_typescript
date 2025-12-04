import {
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
} from "@lib/constants";

export const accountSheetMenuItems: [string, string][] = [
  ["Apply description replacements", "applyDescriptionReplacements"],
  ["Convert current column to uppercase", "convertCurrentColumnToUppercase"],
  ["Update balance values", "accountSheetBalanceValues"],
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
  ["Update open account balances", "updateOpenBalances"],
  ["Validate account keys", "validateAccountKeys"],
];

export const budgetMenuItems: [string, string][] = [
  ["Budget", "toBudget"],
  [MetaBudgetAnnualTransactions.SHEET.NAME, "toBudgetAnnualTransactions"],
  ["Budget monthly transactions", "toBudgetMonthlyTransactions"],
  [MetaBudgetAdHocTransactions.SHEET.NAME, "toBudgetAdHocTransactions"],
  ["Budget predicted spend", "toBudgetPredictedSpend"],
  ["Budget weekly transactions", "toBudgetWeeklyTransactions"],
];

export const gasMenuItems: [string, string][] = [
  ["Balance sheet", "toBalanceSheet"],
  ["Check dependencies", "updateAllDependencies"],
  ["Sort sheet order", "sortSheets"],
  ["Store account sheet names", "storeAccountSheetNames"],
  ["Trim all sheets", "trimAllSheets"],
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
