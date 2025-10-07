/// <reference types="google-apps-script" />
import type { Spreadsheet } from "@domain";
import { MetaBudgetAdHocTransactions as Meta } from "@lib/constants";
import { ONE_DAY } from "@lib/timeConstants";
import type { UpcomingDebitRow } from "@sheets/budgetTypes";
import { TransactionsBase, type BudgetMeta, type DateStrategy } from "@sheets/budget/TransactionsBase";

const adHocStrategy: DateStrategy = {
  mode: "range-check",
  makeTargetDates(today, howManyDaysAhead) {
    // Not used directly for range matching; but we keep the contract.
    // Provide [today, horizonEnd] for consistency and possible logging/visibility.
    const start = new Date(today);
    const end = new Date(today.getTime() + howManyDaysAhead * ONE_DAY);
    return [start, end];
  },
};

export class BudgetAdHocTransactions extends TransactionsBase<BudgetMeta> {
  constructor(spreadsheet: Spreadsheet) {
    super(spreadsheet, Meta, adHocStrategy);
  }

  public getUpcomingDebits(howManyDaysAhead: number, today = new Date()): UpcomingDebitRow[] {
    return super.getUpcomingDebits(howManyDaysAhead, today);
  }
}
