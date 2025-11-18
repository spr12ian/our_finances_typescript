import type { Spreadsheet } from "@domain";
import { MetaHMRC_TaxReturn as Meta } from "@lib/constants";
import { getA1Ranges } from "@lib/getA1Ranges";
import { FastLog, WithLog } from "@lib/logging";
import { BaseSheet } from "../core";
import type { SheetKey } from "src/constants/sheetNames";

export class HMRC_TaxReturn extends BaseSheet {
  static readonly sheetName: SheetKey = Meta.SHEET.NAME as SheetKey;

  constructor(spreadsheet: Spreadsheet) {
    FastLog.log("HMRC_TaxReturn:constructor");
    super(Meta.SHEET.NAME, spreadsheet);
  }

  @WithLog("HMRC_TaxReturn:fixSheet")
  fixSheet(): void {
    this.formatSheet();
  }

  @WithLog("HMRC_TaxReturn:formatSheet")
  formatSheet(): void {
    const sheet = this.sheet.raw;

    const dateRangeList = sheet.getRangeList(getA1Ranges(Meta, "DATE"));
    const moneyRangeList = sheet.getRangeList(getA1Ranges(Meta, "MONEY"));

    this.formatAsDate(dateRangeList);
    this.formatAsMoney(moneyRangeList);

    SpreadsheetApp.flush();
  }
}
