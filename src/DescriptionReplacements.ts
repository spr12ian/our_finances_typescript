/// <reference types="google-apps-script" />
import { MetaAccountSheet } from "./MetaAccountSheet";
import { MetaDescriptionReplacements } from "./MetaDescriptionReplacements";
import type { Sheet } from "./Sheet";
import { createSheet } from "./SheetFactory";

export class DescriptionReplacements {
  static get SHEET() {
    return {
      NAME: "Description replacements",
    };
  }
  constructor(
    private readonly sheet: Sheet,
    private readonly accountMeta = MetaAccountSheet
  ) {
    this.sheet = createSheet(MetaDescriptionReplacements.SHEET.NAME);
  }

  applyReplacements(accountSheet: Sheet) {
    const accountSheetName = accountSheet.name;
    if (accountSheetName === this.name) {
      throw new Error(
        `Cannot applyDescriptionReplacements to '${accountSheetName}'`
      );
    }

    const DESCRIPTION = this.accountMeta.COLUMNS.DESCRIPTION;
    const ROW_DATA_STARTS = this.accountMeta.ROW_DATA_STARTS;

    const headerValue = accountSheet.raw.getRange(1, DESCRIPTION).getValue();

    if (!headerValue.startsWith("Description")) {
      throw new Error(
        `Unexpected description header '${headerValue}' in sheet: ${accountSheetName}`
      );
    }

    const lastRow = accountSheet.raw.getLastRow();
    const numRows = lastRow + 1 - ROW_DATA_STARTS;

    const range = accountSheet.raw.getRange(
      this.accountMeta.ROW_DATA_STARTS,
      this.accountMeta.COLUMNS.DESCRIPTION,
      numRows,
      1
    );
    const values = range.getValues();

    let numReplacements = 0;

    const replacementsMap: Record<string, string> = this.getReplacementsMap();

    for (let row = 0; row < values.length; row++) {
      const description = values[row][0];
      if (replacementsMap.hasOwnProperty(description)) {
        values[row][0] = replacementsMap[description];
        numReplacements++;
      }
    }

    if (numReplacements > 0) {
      range.setValues(values);
    }
  }

  getReplacementsMap(): Record<string, string> {
    const replacements = this.sheet.getDataRange().getValues().slice(1);

    return replacements.reduce((map, [description, replacement]) => {
      if (description && replacement) {
        map[String(description)] = String(replacement);
      }
      return map;
    }, {} as Record<string, string>);
  }

  get name() {
    return this.sheet.name;
  }
}
