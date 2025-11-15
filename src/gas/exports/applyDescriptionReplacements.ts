import { AccountSheet } from "@sheets/classes/AccountSheet";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";
import { withLog } from "../../lib/logging/WithLog";

export function applyDescriptionReplacements() {
  const fn = applyDescriptionReplacements.name;
  const accountSheet = getActiveAccountSheet();
  if (accountSheet) {
    withLog(fn, accountSheet.applyDescriptionReplacements)();
  }
}

function getActiveAccountSheet(): AccountSheet {
  const spreadsheet = getFinancesSpreadsheet();
  return new AccountSheet(spreadsheet.activeSheet, spreadsheet);
}
