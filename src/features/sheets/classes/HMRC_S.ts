import type { Spreadsheet } from "@domain";
import { MetaHMRC_S as Meta } from "@lib/constants";
import { FastLog, WithLog } from "@lib/logging";
import { getA1Ranges } from "@lib/getA1Ranges";
import { BaseSheet } from "../core";

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
    const sheet = this.sheet.raw;

    const dateRangeList = sheet.getRangeList(getA1Ranges(Meta, "DATE"));
    const moneyRangeList = sheet.getRangeList(getA1Ranges(Meta, "MONEY"));

    this.formatAsDate(dateRangeList);
    this.formatAsMoney(moneyRangeList);

    SpreadsheetApp.flush();
  }
}
