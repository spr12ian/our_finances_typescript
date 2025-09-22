import {
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
} from "@lib/constants";

export const accountSheetMenuItems: [string, string][] = [
  ["Apply Description replacements", "applyDescriptionReplacements"],
  ["Convert current column to uppercase", "convertCurrentColumnToUppercase"],
  ["Update balance values", "updateBalanceValues"],
];

export const analyzeTransactionsMenuItems: [string, string][] = [
  ["Not in transaction categories", "goToSheetNotInTransactionCategories"],
  ["Uncategorised by date", "goToSheetUncategorisedByDate"],
  ["Category clash", "goToSheetCategoryClash"],
  ["Categories", "goToSheetCategories"],
  ["Transaction categories", "goToSheetTransactionCategories"],
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
  ["All accounts", "showAllAccounts"],
  ["Balance sheet", "balanceSheet"],
  ["Check dependencies", "updateAllDependencies"],
  ["Daily update", "dailyUpdate"],
  ["Monthly update", "monthlyUpdate"],
  ["Open accounts", "openAccounts"],
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
