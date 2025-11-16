import { AccountSheet } from "@sheets/classes/AccountSheet";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";
import { withLog } from "../../lib/logging/WithLog";

export function applyDescriptionReplacements() {
  const fn = applyDescriptionReplacements.name;
  const accountSheet = withLog(fn, getActiveAccountSheet)();
  if (accountSheet) {
    accountSheet.applyDescriptionReplacements();
  }
}

function getActiveAccountSheet(): AccountSheet {
  const fn= getActiveAccountSheet.name;
  const spreadsheet = withLog(fn, getFinancesSpreadsheet)();
  return new AccountSheet(spreadsheet.activeSheet, spreadsheet);
}
