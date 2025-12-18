// updateTransactionsFormula.ts

import { getFinancesSpreadsheet } from "../../getFinancesSpreadsheet";
import { Transactions } from "./classes/Transactions";

export function updateTransactionsFormula() {
  const spreadsheet = getFinancesSpreadsheet();
  const transactions = new Transactions(spreadsheet);

  transactions.updateFormula();
}
