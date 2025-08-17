/// <reference types="google-apps-script" />
import { MetaAccountSheet as Meta, MetaBankAccounts } from "./constants";
import { DescriptionReplacements } from "./DescriptionReplacements";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
import { xLookup } from "./xLookup";

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

  updateBalanceValues(): void {
    const start = Meta.ROW_DATA_STARTS;
    const allValues = this.sheet.dataRange.getValues();
    const dataRows = allValues.slice(start - 1);
    if (dataRows.length === 0) return;

    let balance = 0;
    const output: number[][] = new Array(dataRows.length);
    let firstDiffIndex = -1;
    const TOL = 0.005; // ~half a penny to avoid FP noise

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const credit = Number(row[Meta.COLUMNS.CREDIT - 1]) || 0;
      const debit = Number(row[Meta.COLUMNS.DEBIT - 1]) || 0;
      const currentBalance = Number(row[Meta.COLUMNS.BALANCE - 1]) || 0;

      balance += credit - debit;
      output[i] = [balance];

      if (firstDiffIndex === -1 && Math.abs(balance - currentBalance) > TOL) {
        firstDiffIndex = i;
      }
    }

    if (firstDiffIndex === -1) {
      console.log(`No changes to balance for ${this.accountName}`);
      return;
    }

    const slice = output.slice(firstDiffIndex);
    this.sheet.raw
      .getRange(start + firstDiffIndex, Meta.COLUMNS.BALANCE, slice.length, 1)
      .setValues(slice);
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
