/// <reference types="google-apps-script" />
import { BankAccounts } from "./BankAccounts";
import { DescriptionReplacements } from "./DescriptionReplacements";
import { MetaAccountSheet } from "./MetaAccountSheet";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";
import { xLookup } from "./xLookup";

export class AccountSheet {
  constructor(
    private readonly sheet: Sheet,
    private readonly accountMeta = MetaAccountSheet,
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    if (sheet.name[0] !== "_") {
      throw new Error(`${sheet.name} is NOT an account sheet`);
    }
  }

  addDefaultNotes() {
    this.addNoteToCell("F1", "Counterparty");
    this.addNoteToCell("G1", "Counterparty date");
  }

  addNoteToCell(a1CellRange: string, note: string) {
    this.sheet.getRange(a1CellRange).setNote(note);
  }

  alignLeft(a1range: string) {
    this.sheet.getRange(a1range).setHorizontalAlignment("left");
  }

  formatSheet() {
    try {
      this.validateSheet();
      this.setSheetFormatting();
      this.addDefaultNotes();
      this.convertColumnToUppercase(this.accountMeta.COLUMNS.DESCRIPTION);
      this.convertColumnToUppercase(this.accountMeta.COLUMNS.NOTE);
      this.setColumnWidth(this.accountMeta.COLUMNS.DESCRIPTION, 500);
      this.setColumnWidth(this.accountMeta.COLUMNS.NOTE, 170);
    } catch (error) {
      throw error;
    }
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

  formatAsBold(a1range: string) {
    this.sheet.getRange(a1range).setFontWeight("bold");
  }

  /**
   * Formats the given A1 cell ranges as dates (dd/MM/yyyy)
   * and applies date validation to each.
   *
   * @param {...string} a1ranges - One or more A1 notation ranges (e.g. "A2:A10").
   */
  formatAsDate(...a1ranges: string[]): void {
    a1ranges.forEach((a1range) => {
      this.setNumberFormat(a1range, "dd/MM/yyyy");
      this.setDateValidation(a1range);
    });
  }

  formatAsUKCurrency(...a1ranges: string[]): void {
    a1ranges.forEach((a1range) => {
      this.setNumberFormat(a1range, "£#,##0.00");
    });
  }

  getExpectedHeader(column: number) {
    return column === this.accountMeta.COLUMNS.DESCRIPTION
      ? xLookup(
          this.getSheetName().slice(1),
          this.spreadsheet.getSheet(BankAccounts.SHEET.NAME),
          "A",
          "AQ"
        )
      : this.accountMeta.HEADERS[column - 1];
  }

  getSheetName() {
    return this.sheet.getSheetName();
  }

  setBackground(a1range: string, background = "#FFFFFF"): void {
    this.sheet.getRange(a1range).setBackground(background);
  }

  setColumnWidth(column: number, widthInPixels: number) {
    this.sheet.setColumnWidth(column, widthInPixels);
  }

  setCounterpartyValidation(a1range: string) {
    const range = this.sheet.getRange(a1range);
    const validationRange = `'${BankAccounts.SHEET.NAME}'!$A$2:$A`;
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

  setDateValidation(a1range: string) {
    const range = this.sheet.getRange(a1range);
    const rule = SpreadsheetApp.newDataValidation()
      .requireDate()
      .setAllowInvalid(false)
      .setHelpText("Please enter a valid date in DD/MM/YYYY format.")
      .build();

    range.setDataValidation(rule);
  }

  setNumberFormat(a1range: string, format: string) {
    this.sheet.getRange(a1range).setNumberFormat(format);
  }

  /* Background colour can be cyan */
  setSheetFont(fontFamily = "Arial", fontSize = 10, fontColor = "#000000") {
    const range = this.sheet.getDataRange();
    range
      .setFontFamily(fontFamily)
      .setFontSize(fontSize)
      .setFontColor(fontColor);
  }

  setSheetFormatting() {
    const sheet = this.sheet;
    const dataRange = sheet.getDataRange();

    dataRange.clearDataValidations();

    // Apply formatting in batches
    const headerRange = sheet.raw.getRange(
      1,
      1,
      1,
      this.accountMeta.MINIMUM_COLUMNS
    );
    headerRange.setFontWeight("bold").setHorizontalAlignment("left");

    this.setCounterpartyValidation("F2:F");
    this.setSheetFont();
    this.formatAsDate("A2:A", "G2:G");
    this.formatAsUKCurrency("C2:D", "H2:H");
    this.formatAsBold("A1:H1");
    this.alignLeft("A1:H1");
    this.setBackground("A1:H1");
  }

  validateFrozenRows() {
    const frozenRows = this.sheet.raw.getFrozenRows();
    if (frozenRows !== 1) {
      throw new Error(`There should be 1 frozen row; found ${frozenRows}`);
    }
  }

  validateHeaders() {
    const headers = this.sheet.raw
      .getRange(1, 1, 1, this.accountMeta.MINIMUM_COLUMNS)
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
    if (lastColumn < this.accountMeta.MINIMUM_COLUMNS) {
      throw new Error(
        `Sheet ${this.getSheetName()} requires at least ${
          this.accountMeta.MINIMUM_COLUMNS
        } columns, but found ${lastColumn}`
      );
    }
  }

  validateSheet() {
    this.validateMinimumColumns();
    this.validateHeaders();
    this.validateFrozenRows();
  }
}
