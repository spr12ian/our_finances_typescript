import type { Spreadsheet } from "@domain";
import { MetaOurMoney as Meta } from "@lib/constants";
import { FastLog, WithLog } from "@lib/logging";
import { BaseSheet } from "../core";
import { getA1Ranges } from '@lib/getA1Ranges';
import type { SheetKey } from "src/constants/sheetNames";

export class OurMoney extends BaseSheet {
  static readonly sheetName: SheetKey = Meta.SHEET.NAME;

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
    const sheet = this.sheet.raw;

    const dateRangeList = sheet.getRangeList(getA1Ranges(Meta, "DATE"));
    const moneyRangeList = sheet.getRangeList(getA1Ranges(Meta, "MONEY"));

    this.formatAsDate(dateRangeList);
    this.formatAsMoney(moneyRangeList);

    SpreadsheetApp.flush();
  }
}
