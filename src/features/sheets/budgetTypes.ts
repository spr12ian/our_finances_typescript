export interface BankDebitDueRow {
  account: string;
  amount: string; // formatted GBP string for consistency with other outputs
}

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
