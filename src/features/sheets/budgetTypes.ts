
import type { OneBased } from "../../types/oneBased";

export interface BankDebitDueRow {
  account: string;
  amount: string; // formatted GBP string for consistency with other outputs
}

export type BudgetColumns = {
  DATE: OneBased<number>;
  DEBIT_AMOUNT: OneBased<number>;
  FROM_ACCOUNT: OneBased<number>;
  PAYMENT_TYPE: OneBased<number>;
  DESCRIPTION: OneBased<number>;
};

export type UpcomingDebit = {
  section:string;
  rows: UpcomingDebitRow[];
}

export type UpcomingDebitRow = {
  date: string;
  amount: string;
  from: string;
  by: string;
  description: string;
};
