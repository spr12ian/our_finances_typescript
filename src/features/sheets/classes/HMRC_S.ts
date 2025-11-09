import type { Spreadsheet } from "@domain";
import { MetaHMRC_S as Meta } from "@lib/constants";
import { FastLog, WithLog } from "@lib/logging";
import { BaseSheet } from "../core";

type HMRC_S_RangeKey = "date_of_birth" | "untaxedInterest" | "benefitIncome" | "rlf_pension";

type HMRC_S_RangeMap = Readonly<Record<HMRC_S_RangeKey, string>>;

export class HMRC_S extends BaseSheet {
  constructor(spreadsheet: Spreadsheet) {
    FastLog.log("HMRC_S:constructor");
    super(Meta.SHEET.NAME, spreadsheet);
  }

  @WithLog("HMRC_S:fixSheet")
  fixSheet(): void {
    this.formatSheet();
  }

  @WithLog("HMRC_S:formatSheet")
  formatSheet(): void {
    const s = this.sheet.raw;

    // Batch all getRange() calls up front
    const ranges: HMRC_S_RangeMap = {
      date_of_birth: Meta.CELLS.DATE_OF_BIRTH_CELL,
      untaxedInterest: Meta.CELLS.UNTAXED_INTEREST_CELL,
      benefitIncome: Meta.CELLS.BENEFIT_INCOME_CELL,
      rlf_pension: Meta.CELLS.RLF_PENSION_CELL,
    };

    // Build RangeLists in one go
    const dateRangeList = s.getRangeList([ranges.date_of_birth]);
    const moneyRangeList = s.getRangeList([
      ranges.untaxedInterest,
      ranges.benefitIncome,
      ranges.rlf_pension,
    ]);

    this.formatAsDate(dateRangeList);
    this.formatAsMoney(moneyRangeList);

    SpreadsheetApp.flush();
  }
}
