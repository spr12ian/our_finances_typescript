/// <reference types="google-apps-script" />
import { DescriptionReplacements } from "./features/sheets/DescriptionReplacements";
import { MetaAccountSheet as Meta, MetaBankAccounts } from "./lib/constants";

import type { Sheet } from "@domain/Sheet";
import { Spreadsheet } from "@domain/Spreadsheet";
import { FastLog } from "./lib/logging/FastLog";
import { xLookup } from "./lib/xLookup";
export class AccountSheet {
  constructor(
    private readonly sheet: Sheet,
    private readonly spreadsheet: Spreadsheet
  ) {
    if (sheet.name[0] !== "_") {
      throw new Error(`${sheet.name} is NOT an account sheet`);
    }
  }

  get accountName(): string {
    return this.name.slice(1);
  }

  get name(): string {
    return this.sheet.name;
  }

  addDefaultNotes() {
    this.addNoteToCell("F1", "Counterparty");
    this.addNoteToCell("G1", "Counterparty date");
  }

  addNoteToCell(a1CellRange: string, note: string) {
    this.sheet.getRange(a1CellRange).setNote(note);
  }

  applyDescriptionReplacements() {
    const descriptionReplacements = new DescriptionReplacements(
      this.spreadsheet
    );
    descriptionReplacements.applyReplacements(this.sheet);
  }

  convertColumnToUppercase(column: number) {
    const START_ROW = 2;
    const lastRow = this.sheet.raw.getLastRow();
    const numRows = lastRow - START_ROW + 1;

    const range = this.sheet.raw.getRange(START_ROW, column, numRows, 1);
    const values = range
      .getValues()
      .map((row: string[]) => [row[0]?.toString().toUpperCase()]);

    range.setValues(values);
  }

  handleEditTrigger() {
    FastLog.log("AccountSheet.handleEditTrigger");
  }

  fixHeaders() {
    const headerRange = this.sheet.getRange("A1:H1");
    const label = xLookup(
      this.accountName,
      this.spreadsheet.getSheet(MetaBankAccounts.SHEET.NAME),
      "A",
      "AP"
    );
    const description = `Description (${label}) ${this.accountName}`;
    const headers = [Meta.HEADERS];
    headers[0][Meta.COLUMNS.DESCRIPTION - 1] = description;
    headerRange.setValues(headers);
  }

  fixSheet() {
    this.updateBalanceValues();
    this.fixHeaders();
    this.formatSheet();
    const lastRow = this.sheet.getTrueDataBounds().lastRow;
    this.sheet.setActiveRange(this.sheet.raw.getRange(lastRow, 1));
    this.sheet.trimSheet();
  }

  formatSheet() {
    const sheet = this.sheet;
    try {
      sheet.formatSheet();
      this.validateSheet();
      this.setSheetFormatting();
      this.addDefaultNotes();
      if (sheet.name !== "_SVI2TJ" && sheet.name !== "_SVIIRF") {
        this.convertColumnToUppercase(Meta.COLUMNS.DESCRIPTION);
        this.convertColumnToUppercase(Meta.COLUMNS.NOTE);
      }
      sheet.raw
        .autoResizeColumn(Meta.COLUMNS.DATE)
        .setColumnWidth(Meta.COLUMNS.DESCRIPTION, 500)
        .autoResizeColumn(Meta.COLUMNS.CREDIT)
        .autoResizeColumn(Meta.COLUMNS.DEBIT)
        .setColumnWidth(Meta.COLUMNS.NOTE, 170)
        .setColumnWidth(Meta.COLUMNS.COUNTERPARTY, 97)
        .autoResizeColumn(Meta.COLUMNS.COUNTERPARTY_DATE)
        .autoResizeColumn(Meta.COLUMNS.BALANCE);
    } catch (error) {
      throw error;
    }
  }

  setCounterpartyValidation(a1range: string) {
    const range = this.sheet.getRange(a1range);
    const validationRange = `'${MetaBankAccounts.SHEET.NAME}'!$A$2:$A`;
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(
        this.sheet.raw.getParent().getRange(validationRange),
        true
      )
      .setAllowInvalid(false)
      .setHelpText("Please select a valid counterparty.")
      .build();

    range.setDataValidation(rule);
  }

  setSheetFormatting() {
    const sheet = this.sheet;
    const dataRange = sheet.dataRange;

    dataRange.clearDataValidations();

    this.setCounterpartyValidation("F2:F");
    sheet.setNumberFormatAsDate("A2:A", "G2:G");
    sheet.setNumberFormatAsUKCurrency("C2:D", "H2:H");
  }

  updateBalanceValues(rowEdited?: number): void {
    const COLUMNS = Meta.COLUMNS;
    const ROW_DATA_STARTS = Meta.ROW_DATA_STARTS;
    const gasSheet = this.sheet.raw;

    // Clamp to first data row
    const row = Math.max(ROW_DATA_STARTS, rowEdited ?? ROW_DATA_STARTS);
    const lastRow = gasSheet.getLastRow();
    const len = Math.max(0, lastRow - row + 1);
    if (len === 0) return;

    // Seed running balance from the previous row’s BALANCE (or 0 if first data row)
    const toPennies = (v: unknown) => Math.round((Number(v) || 0) * 100);
    let balP = 0;
    if (row > ROW_DATA_STARTS) {
      balP = toPennies(gasSheet.getRange(row - 1, COLUMNS.BALANCE).getValue());
    }

    const creditColumn = gasSheet
      .getRange(row, COLUMNS.CREDIT, len, 1)
      .getValues();
    const debitColumn = gasSheet
      .getRange(row, COLUMNS.DEBIT, len, 1)
      .getValues();
    const balanceColumn = gasSheet
      .getRange(row, COLUMNS.BALANCE, len, 1)
      .getValues();

    const output: number[][] = new Array(len);
    let firstDiffIndex = -1;

    for (let i = 0; i < len; i++) {
      const creditP = toPennies(creditColumn[i][0]) || 0;
      const debitP = toPennies(debitColumn[i][0]) || 0;
      const currentBalanceP = toPennies(balanceColumn[i][0]) || 0;

      balP += creditP - debitP;
      output[i] = [balP / 100];

      if (firstDiffIndex === -1 && currentBalanceP !== balP) {
        firstDiffIndex = i;
      }
    }

    if (firstDiffIndex === -1) {
      FastLog.log(`No changes to balance for ${this.accountName}`);
      return;
    }

    const slice = output.slice(firstDiffIndex);
    gasSheet
      .getRange(row + firstDiffIndex, COLUMNS.BALANCE, slice.length, 1)
      .setValues(slice);

    FastLog.log(`Updated balance values for ${this.accountName}`);
  }

  validateFrozenRows() {
    const frozenRows = this.sheet.raw.getFrozenRows();
    if (frozenRows !== 1) {
      throw new Error(`There should be 1 frozen row; found ${frozenRows}`);
    }
  }

  validateMinimumColumns() {
    const lastColumn = this.sheet.raw.getLastColumn();
    if (lastColumn < Meta.MINIMUM_COLUMNS) {
      throw new Error(
        `Sheet ${this.name} requires at least ${Meta.MINIMUM_COLUMNS} columns, but found ${lastColumn}`
      );
    }
  }

  validateSheet() {
    this.validateMinimumColumns();
    this.validateFrozenRows();
  }
}
