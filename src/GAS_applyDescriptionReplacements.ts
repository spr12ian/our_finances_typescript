import { Spreadsheet } from './Spreadsheet';
import { AccountSheet } from './AccountSheet';

export function GAS_applyDescriptionReplacements() {
  const spreadsheet = Spreadsheet.getActive();
  const activeSheet = spreadsheet.activeSheet;
  const accountSheet = new AccountSheet(activeSheet);
  if (accountSheet) {
    accountSheet.applyDescriptionReplacements();
  }
}
