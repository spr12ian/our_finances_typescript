import { Spreadsheet } from "@domain";
import { MetaShares as Meta } from "@lib/constants";
import { FastLog, propertyStart } from "@logging";
import { BaseSheet } from "../core";

export class Shares extends BaseSheet {
  constructor(spreadsheet: Spreadsheet) {
    super(Meta.SHEET.NAME, spreadsheet);
  }

  get totalValue(): number {
    const finish = propertyStart("totalValue", this.constructor.name);
    try {
      const rows = this.dataRows;
      FastLog.log(`Data rows count: ${rows.length}`);
      if (!rows || rows.length < 1) return 0; // no data rows

      // Convert once from 1-based to 0-based
      const balanceCol = Meta.COLUMNS.BALANCE - 1;
      FastLog.log(`Using balance column index: ${balanceCol}`);

      const MIN_BALANCE = 0;

      const toNumberOrNaN = (v: unknown): number => {
        if (typeof v === "number") return v; // already numeric
        if (typeof v === "string") {
          const t = v.trim();
          if (!t) return NaN; // treat empty as missing, not 0
          const n = Number(t.replace(/[,£%]/g, "")); // strip commas/£/% if present
          return Number.isFinite(n) ? n : NaN;
        }
        return NaN;
      };

      let total = 0;
      // Classic for-loop is fastest in GAS
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        FastLog.log(`Row ${r + 1}: ${row}`);
        const balance = toNumberOrNaN(row[balanceCol]);
        if (!(balance > MIN_BALANCE)) continue; // also excludes NaN
        total += balance;
      }

      FastLog.log(`Calculated total value: ${total}`);
      return total;
    } finally {
      finish();
    }
  }
}
