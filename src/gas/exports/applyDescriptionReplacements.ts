import { AccountSheet } from "@sheets/classes/AccountSheet";
import { getFinancesSpreadsheet } from 'src/getFinancesSpreadsheet';

export function getActiveAccountSheet(): AccountSheet {
  const spreadsheet = getFinancesSpreadsheet();
  return new AccountSheet(spreadsheet.activeSheet, spreadsheet);
}

export function applyDescriptionReplacements() {
  const accountSheet = getActiveAccountSheet();
  if (accountSheet) {
    accountSheet.applyDescriptionReplacements();
  }
}
