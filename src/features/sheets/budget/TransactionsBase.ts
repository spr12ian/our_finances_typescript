// TransactionsBase.ts
import type { Sheet, Spreadsheet } from "@domain";
import { col0 } from "@lib/columns";
import { formatLondonDate, getOrdinalDateTZ } from "@lib/dates";
import { getAmountAsGBP } from "@lib/money";
import { ONE_DAY_MS } from "@lib/timeConstants";
import type { BudgetColumns, UpcomingDebitRow } from "@sheets/budgetTypes";

/** Minimal meta contract each sheet uses */
export type BudgetMeta = {
  SHEET: { NAME: string };
  COLUMNS: BudgetColumns;
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
    const dateVal = row[col0(this.meta.COLUMNS, "DATE")];
    return dateVal !== "" && dateVal != null;
  }

  /** Convert a qualifying row into an `UpcomingDebitRow` */
  protected toUpcomingDebitRow(rawDate: Date, row: any[]): UpcomingDebitRow {
    const C = this.meta.COLUMNS;
    const amtIdx = col0(C, "DEBIT_AMOUNT");
    const fromIdx = col0(C, "FROM_ACCOUNT");
    const byIdx = col0(C, "PAYMENT_TYPE");
    const descIdx = col0(C, "DESCRIPTION");

    const amount = Number(row[amtIdx]) || 0;
    return {
      date: getOrdinalDateTZ(rawDate),
      amount: getAmountAsGBP(amount),
      from: String(row[fromIdx] ?? ""),
      by: String(row[byIdx] ?? ""),
      description: String(row[descIdx] ?? ""),
    };
  }

  /** Public: shared “engine” that both subclasses call */
  public getUpcomingDebits(
    howManyDaysAhead: number,
    today = new Date()
  ): UpcomingDebitRow[] {
    const C = this.meta.COLUMNS;
    const rows: UpcomingDebitRow[] = [];
    const targets = this.strategy.makeTargetDates(today, howManyDaysAhead);
    const targetLabelToDate = buildTargetLabelToDateMap(targets);

    const horizonEnd =
      this.strategy.mode === "range-check"
        ? new Date(today.getTime() + howManyDaysAhead * ONE_DAY_MS)
        : null;

    const dateIdx = col0(C, "DATE");
    const debitIdx = col0(C, "DEBIT_AMOUNT");

    for (const row of this.dataRows) {
      if (!this.isCandidateRow(row)) continue;

      const changeAmount = Number(row[debitIdx]) || 0;
      if (Math.abs(changeAmount) <= 1) continue;

      const rawCell = row[dateIdx];
      const rowDate = rawCell instanceof Date ? rawCell : new Date(rawCell);

      if (this.strategy.mode === "label-match") {
        const label = formatLondonDate(rowDate);
        const matched = targetLabelToDate.get(label);
        if (!matched) continue;
        rows.push(this.toUpcomingDebitRow(matched, row));
      } else {
        if (!horizonEnd) continue;
        if (rowDate >= today && rowDate <= horizonEnd) {
          rows.push(this.toUpcomingDebitRow(rowDate, row));
        }
      }
    }

    return rows;
  }
}
