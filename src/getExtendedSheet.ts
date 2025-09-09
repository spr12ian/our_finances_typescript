import { AccountSheet } from "./AccountSheet";
import { isAccountSheetName } from "./accountSheetFunctions";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { AccountBalances } from "./app/sheets/AccountBalances";

export function getExtendedSheet(sheetName: string): any {
  const spreadsheet = getFinancesSpreadsheet();
  if (isAccountSheetName(sheetName)) {
    const sheet = spreadsheet.getSheet(sheetName);
    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found`);
    }
    return new AccountSheet(sheet, spreadsheet);
  }

  const SheetClass = getSheetClass(sheetName);
  if (SheetClass) {
    return new SheetClass(spreadsheet);
  }
  return null;
}

export function getSheetClass(sheetName: string): any {
  // Implementation to get the correct sheet class based on the sheetName
  // For example, you might have a mapping of sheet names to classes
  const sheetClassMap: { [key: string]: any } = {
    "Account balances": AccountBalances,
    // "BudgetSheet": BudgetSheet,
    // Add other mappings as necessary
  };

  return sheetClassMap[sheetName] || null;
}
