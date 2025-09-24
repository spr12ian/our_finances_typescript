/// <reference types="google-apps-script" />
import type { Sheet, Spreadsheet } from "@domain";
import { MetaBudgetAdHocTransactions as Meta } from "@lib/constants";
import { renderUpcomingDebitsHtml } from "@lib/renderUpcomingDebitsHtml";
import { getOrdinalDateTZ } from "./lib/dates";
import { getAmountAsGBP } from "./lib/money";
import { ONE_DAY } from '@lib/timeConstants';
export class BudgetAdHocTransactions {
  private readonly sheet: Sheet;
  constructor(private readonly spreadsheet: Spreadsheet) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
  }

  get dataRows(): any[][] {
    return this.sheet.dataRows;
  }

  // Main method to get upcoming debits
  getUpcomingDebits(howManyDaysAhead: number): Html {
    if (this.dataRows.length < 1) return "";

    const now = new Date();
    const cutoff = new Date(
      now.getTime() + howManyDaysAhead * ONE_DAY
    );

    type Row = {
      date: string;
      amount: string;
      from: string;
      by: string;
      description: string;
    };
    const rows: Row[] = [];

    for (const transaction of this.dataRows) {
      const changeAmount = transaction[Meta.COLUMNS.CHANGE_AMOUNT];
      if (!(Math.abs(changeAmount) > 1)) continue;

      const rawDate = new Date(transaction[Meta.COLUMNS.DATE]);
      if (!(rawDate >= now && rawDate <= cutoff)) continue;

      rows.push({
        date: getOrdinalDateTZ(rawDate),
        amount: getAmountAsGBP(changeAmount),
        from: String(transaction[Meta.COLUMNS.FROM_ACCOUNT] ?? ""),
        by: String(transaction[Meta.COLUMNS.PAYMENT_TYPE] ?? ""),
        description: String(transaction[Meta.COLUMNS.DESCRIPTION] ?? ""),
      });
    }

    if (rows.length === 0) return "";

    return renderUpcomingDebitsHtml(rows);
  }
}
