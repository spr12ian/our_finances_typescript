// src/sheets/Assets/Assets.ts
import type { Sheet, Spreadsheet } from "@domain";
import { BaseSheet } from "../core/BaseSheet";

export abstract class AssetsCore extends BaseSheet {
  protected constructor(name: string, spreadsheet: Spreadsheet, sheet: Sheet) {
    super(name, spreadsheet, sheet);
  }
}
