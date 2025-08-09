/// <reference types="google-apps-script" />
import { MetaAccountSheet as Meta, MetaBankAccounts } from "./constants";
import { DescriptionReplacements } from "./DescriptionReplacements";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
import { xLookup } from "./xLookup";

export class AccountSheet {
  constructor(
    private readonly sheet: Sheet,
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
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
    this.fixHeaders();
    this.formatSheet();
    this.sheet.trimSheet();
  }

  applyDescriptionReplacements() {
    const descriptionReplacements = new DescriptionReplacements();
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

  formatSheet() {
    try {
      this.sheet.formatSheet();
      this.validateSheet();
      this.setSheetFormatting();
      this.addDefaultNotes();
      this.convertColumnToUppercase(Meta.COLUMNS.DESCRIPTION);
      this.convertColumnToUppercase(Meta.COLUMNS.NOTE);
      this.sheet.raw.setColumnWidth(Meta.COLUMNS.DESCRIPTION, 500);
      this.sheet.raw.setColumnWidth(Meta.COLUMNS.NOTE, 170);
    } catch (error) {
      throw error;
    }
  }

  getExpectedHeader(column: number) {
    return column === Meta.COLUMNS.DESCRIPTION
      ? xLookup(
          this.accountName,
          this.spreadsheet.getSheet(MetaBankAccounts.SHEET.NAME),
          "A",
          "AQ"
        )
      : Meta.HEADERS[column - 1];
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

  validateFrozenRows() {
    const frozenRows = this.sheet.raw.getFrozenRows();
    if (frozenRows !== 1) {
      throw new Error(`There should be 1 frozen row; found ${frozenRows}`);
    }
  }

  validateHeaders() {
    const headers = this.sheet.raw
      .getRange(1, 1, 1, Meta.MINIMUM_COLUMNS)
      .getValues()[0];
    headers.forEach((value: string, index: number) => {
      const expected = this.getExpectedHeader(index + 1);
      if (value !== expected) {
        throw new Error(
          `Column ${index + 1} should be '${expected}' but found '${value}'`
        );
      }
    });
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
    this.validateHeaders();
    this.validateFrozenRows();
  }
}
