import type { Spreadsheet } from "@domain";
import { MetaAssets as Meta } from "@lib/constants";
import { BaseSheet } from "../core";

export class Assets extends BaseSheet {
  constructor(spreadsheet: Spreadsheet) {
    super(Meta.SHEET.NAME, spreadsheet);
  }

  // Asset-related methods go here
}
