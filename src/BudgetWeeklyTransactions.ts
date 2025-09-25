/// <reference types="google-apps-script" />
import type { Spreadsheet } from "@domain";
import { MetaBudgetWeeklyTransactions as Meta } from "@lib/constants";
import { setupDaysIteratorTZ } from "./lib/dates";
import type { UpcomingDebitRow } from "@sheets/budgetTypes";
import { TransactionsBase, type BudgetMeta, type DateStrategy } from "@sheets/budget/TransactionsBase";

const weeklyStrategy: DateStrategy = {
  mode: "label-match",
  makeTargetDates(today, howManyDaysAhead) {
    const { first, iterator } = setupDaysIteratorTZ(today);
    const out: Date[] = [];
    let d = first;
    for (let i = 0; i <= howManyDaysAhead; i++) {
      out.push(d.date);
      d = iterator.next()!;
    }
    return out;
  },
};

export class BudgetWeeklyTransactions extends TransactionsBase<BudgetMeta> {
  constructor(spreadsheet: Spreadsheet) {
    super(spreadsheet, Meta, weeklyStrategy);
  }

  // Optionally override isCandidateRow(...) if weekly needs extra guards.
  public getUpcomingDebits(howManyDaysAhead: number, today = new Date()): UpcomingDebitRow[] {
    return super.getUpcomingDebits(howManyDaysAhead, today);
  }
}
