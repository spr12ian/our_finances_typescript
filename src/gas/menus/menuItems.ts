import {
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
} from "@lib/constants";

export const accountSheetMenuItems: [string, string][] = [
  ["Update balance values", "updateBalanceValues"],
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
  ["Apply Description replacements", "applyDescriptionReplacements"],
  ["Balance sheet", "balanceSheet"],
  ["Check dependencies", "updateAllDependencies"],
  ["Convert current column to uppercase", "convertCurrentColumnToUppercase"],
  ["Daily update", "dailyUpdate"],
  ["Fix sheet", "fixSheet"],
  ["Monthly update", "monthlyUpdate"],
  ["Open accounts", "openAccounts"],
  ["Sort sheet order", "sortSheets"],
  ["Trim all sheets", "trimAllSheets"],
  ["Update spreadsheet summary", "updateSpreadsheetSummary"],
  ["Validate all menu function names", "validateAllMenuFunctionNames"],
];

export const sheetMenuItems: [string, string][] = [
  ["Format sheet", "formatSheet"],
  ["Trim sheet", "trimSheet"],
];

export const transactionsMenuItems: [string, string][] = [
  ["Transactions by date", "goToSheetTransactionsByDate"],
  ["Update 'Transactions'", "updateTransactions"],
];
