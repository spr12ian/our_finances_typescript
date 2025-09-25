/// <reference types="google-apps-script" />
import type { Sheet, Spreadsheet } from "@domain";
import type { UpcomingDebitRow } from "@sheets/budgetTypes";
import { formatLondonDate, getOrdinalDateTZ } from "@lib/dates";
import { getAmountAsGBP } from "@lib/money";
import { ONE_DAY } from "@lib/timeConstants";

/** Minimal meta contract each sheet uses */
export type BudgetMeta = {
  SHEET: { NAME: string };
  COLUMNS: {
    DATE: number;
    DEBIT_AMOUNT: number;
    FROM_ACCOUNT: number;
    PAYMENT_TYPE: number;
    DESCRIPTION: number;
  };
};

export type DateMatchMode = "label-match" | "range-check";

/** Pluggable date strategy */
export interface DateStrategy {
  /** Produce “target” dates to consider (for label matching or range end) */
  makeTargetDates(today: Date, howManyDaysAhead: number): Date[];

  /** How to interpret/compare dates for this sheet */
  mode: DateMatchMode;
}

/** Shared helper to index target dates by their London label */
function buildTargetLabelToDateMap(dates: Date[]): Map<string, Date> {
  const m = new Map<string, Date>();
  for (const d of dates) {
    m.set(formatLondonDate(d), d);
  }
  return m;
}

/** Base class: everything shared lives here. Subclasses only provide `meta` and `strategy`. */
export abstract class TransactionsBase<M extends BudgetMeta> {
  protected readonly sheet: Sheet;

  constructor(
    protected readonly spreadsheet: Spreadsheet,
    protected readonly meta: M,
    protected readonly strategy: DateStrategy
  ) {
    this.sheet = this.spreadsheet.getSheet(this.meta.SHEET.NAME);
  }

  /** Raw data rows (no headers) */
  protected get dataRows(): any[][] {
    return this.sheet.dataRows;
  }

  /** Hook to filter out rows that shouldn’t be considered (e.g., blank dates) */
  protected isCandidateRow(row: any[]): boolean {
    const dateVal = row[this.meta.COLUMNS.DATE];
    return dateVal !== "" && dateVal != null;
  }

  /** Convert a qualifying row into an `UpcomingDebitRow` */
  protected toUpcomingDebitRow(rawDate: Date, row: any[]): UpcomingDebitRow {
    const { COLUMNS: C } = this.meta;
    const amount = Number(row[C.DEBIT_AMOUNT]) || 0;
    return {
      date: getOrdinalDateTZ(rawDate),
      amount: getAmountAsGBP(amount),
      from: String(row[C.FROM_ACCOUNT] ?? ""),
      by: String(row[C.PAYMENT_TYPE] ?? ""),
      description: String(row[C.DESCRIPTION] ?? ""),
    };
  }

  /** Public: shared “engine” that both subclasses call */
  public getUpcomingDebits(howManyDaysAhead: number, today = new Date()): UpcomingDebitRow[] {
    const { COLUMNS: C } = this.meta;
    const rows: UpcomingDebitRow[] = [];
    const targets = this.strategy.makeTargetDates(today, howManyDaysAhead);
    const targetLabelToDate = buildTargetLabelToDateMap(targets);

    const horizonEnd =
      this.strategy.mode === "range-check"
        ? new Date(today.getTime() + howManyDaysAhead * ONE_DAY)
        : null;

    for (const row of this.dataRows) {
      if (!this.isCandidateRow(row)) continue;

      const changeAmount = Number(row[C.DEBIT_AMOUNT]) || 0;
      if (Math.abs(changeAmount) <= 1) continue;

      const rawCell = row[C.DATE];
      const rowDate = new Date(rawCell);

      if (this.strategy.mode === "label-match") {
        // Match by label to any of the target dates
        const label = formatLondonDate(rowDate);
        const matched = targetLabelToDate.get(label);
        if (!matched) continue;
        rows.push(this.toUpcomingDebitRow(matched, row));
      } else {
        // Range check: today <= rowDate <= horizonEnd
        if (!horizonEnd) continue;
        if (rowDate >= today && rowDate <= horizonEnd) {
          rows.push(this.toUpcomingDebitRow(rowDate, row));
        }
      }
    }

    return rows;
  }
}
