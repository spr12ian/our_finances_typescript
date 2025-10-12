import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { BankAccounts } from "@sheets/classes/BankAccounts";

export function validateAccountKeys() {
  const spreadsheet = getFinancesSpreadsheet();
  new BankAccounts(spreadsheet).validateKeys();
}
