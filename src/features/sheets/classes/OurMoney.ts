import type { Spreadsheet } from "@domain";
import { MetaOurMoney as Meta } from "@lib/constants";
import { FastLog, WithLog } from "@lib/logging";
import { BaseSheet } from "../core";

export class OurMoney extends BaseSheet {
  constructor(spreadsheet: Spreadsheet) {
    FastLog.log("OurMoney:constructor");
    super(Meta.SHEET.NAME, spreadsheet);
  }

  @WithLog("OurMoney:fixSheet")
  fixSheet(): void {
    this.formatSheet();
  }

  @WithLog("OurMoney:formatSheet")
  formatSheet(): void {
    const s = this.sheet;

    // Batch all getRange() calls up front
    const ranges = {
      asAt: s.getRange(Meta.CELLS.AS_AT_DATE_CELL),
      total: s.getRange(Meta.CELLS.TOTAL_MONEY_CELL),
      pension: s.getRange(Meta.CELLS.PENSION_FUNDS_CELL),
      bank: s.getRange(Meta.CELLS.IN_THE_BANK_CELL),
    };

    // Apply all format/alignment changes in memory
    ranges.asAt.setNumberFormat("dd/MM/yyyy").setHorizontalAlignment("center");

    const moneyFormat = "£#,##0.00";
    for (const key of ["total", "pension", "bank"] as const) {
      ranges[key].setNumberFormat(moneyFormat).setHorizontalAlignment("right");
    }

    // Push all pending changes to the server once
    SpreadsheetApp.flush();
  }
}
