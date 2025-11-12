import type { Spreadsheet } from "@domain";
import { MetaHMRC_B as Meta } from "@lib/constants";
import { getA1Ranges } from "@lib/getA1Ranges";
import { FastLog, WithLog } from "@lib/logging";
import { BaseSheet } from "../core";

export class HMRC_B extends BaseSheet {
  constructor(spreadsheet: Spreadsheet) {
    FastLog.log("HMRC_B:constructor");
    super(Meta.SHEET.NAME, spreadsheet);
  }

  @WithLog("HMRC_B:fixSheet")
  fixSheet(): void {
    this.formatSheet();
  }

  @WithLog("HMRC_B:formatSheet")
  formatSheet(): void {
    const sheet = this.sheet.raw;

    const dateRangeList = sheet.getRangeList(getA1Ranges(Meta, "DATE"));
    const moneyRangeList = sheet.getRangeList(getA1Ranges(Meta, "MONEY"));

    this.formatAsDate(dateRangeList);
    this.formatAsMoney(moneyRangeList);

    SpreadsheetApp.flush();
  }
}
