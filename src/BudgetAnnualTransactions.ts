/// <reference types="google-apps-script" />
import type { Spreadsheet } from "@domain";
import { MetaBudgetAnnualTransactions as Meta } from "@lib/constants";
import {
  TransactionsBase,
  type BudgetMeta,
  type DateStrategy,
} from "@sheets/budget/TransactionsBase";
import type { UpcomingDebitRow } from "@sheets/budgetTypes";
import { setupDaysIteratorTZ } from "./lib/dates";




/** Same date strategy as Weekly: match by London-label across N days */
const annualStrategy: DateStrategy = {
  mode: "label-match",
  makeTargetDates(today, howManyDaysAhead) {
    const { first, iterator } = setupDaysIteratorTZ(today);
    const out: Date[] = [];
    let d = first;
    for (let i = 0; i <= howManyDaysAhead; i++) {
      out.push(d.date);
      d = iterator.next(); // next() returns the DayInfo directly (no .value)
    }
    return out;
  },
};

export class BudgetAnnualTransactions extends TransactionsBase<BudgetMeta> {
  constructor(spreadsheet: Spreadsheet) {
    super(spreadsheet, Meta, annualStrategy);
  }

  // If Annual needs special row filtering later (e.g., skip markers),
  // override isCandidateRow(row: any[]): boolean { ... } here.

  public getUpcomingDebits(
    howManyDaysAhead: number,
    today = new Date()
  ): UpcomingDebitRow[] {
    return super.getUpcomingDebits(howManyDaysAhead, today);
  }
  
}
