import type { Spreadsheet } from "@domain";
import { MetaOurMoney as Meta } from "@lib/constants";
import { FastLog, WithLog } from "@lib/logging";
import { BaseSheet } from "../core";

type OurMoneyRangeKey = "asAt" | "total" | "pension" | "bank";

type OurMoneyRangeMap = Readonly<Record<OurMoneyRangeKey, string>>;

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
    const s = this.sheet.raw;

    // Batch all getRange() calls up front
    const ranges: OurMoneyRangeMap = {
      asAt: Meta.CELLS.AS_AT_DATE_CELL,
      total: Meta.CELLS.TOTAL_MONEY_CELL,
      pension: Meta.CELLS.PENSION_FUNDS_CELL,
      bank: Meta.CELLS.IN_THE_BANK_CELL,
    };

    // Build RangeLists in one go
    const dateRangeList = s.getRangeList([ranges.asAt]);
    const moneyRangeList = s.getRangeList([
      ranges.total,
      ranges.pension,
      ranges.bank,
    ]);

    this.formatAsDate(dateRangeList);
    this.formatAsMoney(moneyRangeList);

    SpreadsheetApp.flush();
  }
}
