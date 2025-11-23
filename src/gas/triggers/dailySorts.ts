import {
  MetaBankAccounts,
  MetaBudgetAdHocTransactions,
  MetaBudgetAnnualTransactions,
  MetaBudgetMonthlyTransactions,
  MetaBudgetWeeklyTransactions,
  MetaDescriptionReplacements,
  MetaTransactionCategories,
} from "@lib/constants";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";

export function dailySorts() {
  const spreadsheet = getFinancesSpreadsheet();
  const sheetsToSort = [
    MetaBankAccounts.SHEET.NAME,
    MetaBudgetAdHocTransactions.SHEET.NAME,
    MetaBudgetAnnualTransactions.SHEET.NAME,
    MetaBudgetMonthlyTransactions.SHEET.NAME,
    MetaBudgetWeeklyTransactions.SHEET.NAME,
    MetaDescriptionReplacements.SHEET.NAME,
    MetaTransactionCategories.SHEET.NAME,
  ];
  sheetsToSort.forEach((sheetName) => {
    const sheet = spreadsheet.getSheet(sheetName);
    if (sheet) {
      sheet.sortByFirstColumnOmittingHeader();
    }
  });
}
