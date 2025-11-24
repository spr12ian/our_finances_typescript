import { AccountSheet } from "@sheets/classes/AccountSheet";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";
import { withLog } from "../../lib/logging/WithLog";

export function applyDescriptionReplacements() {
  const accountSheet = withLog(getActiveAccountSheet)();
  if (accountSheet) {
    accountSheet.applyDescriptionReplacements();
  }
}

function getActiveAccountSheet(): AccountSheet {
  const spreadsheet = withLog(getFinancesSpreadsheet)();
  return new AccountSheet(spreadsheet.activeSheet, spreadsheet);
}
