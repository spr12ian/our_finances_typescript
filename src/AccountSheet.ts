/// <reference types="google-apps-script" />

import { BankAccounts } from "./BankAccounts";
import { DescriptionReplacements } from "./DescriptionReplacements";
import { Sheet } from "./Sheet";

export class AccountSheet {
  private sheet: Sheet;
  static get COLUMNS() {
    return {
      DATE: 1,
      DESCRIPTION: 2,
      CREDIT: 3,
      DEBIT: 4,
      NOTE: 5,
      COUNTERPARTY: 6,
      COUNTERPARTY_DATE: 7,
      BALANCE: 8,
    };
  }

  static get ROW_DATA_STARTS() {
    return 2;
  }

  static get HEADERS() {
    return [
      "Date",
      "Description",
      "Credit (£)",
      "Debit (£)",
      "Note",
      "CPTY",
      "Date CPTY",
      "Balance (£)",
    ];
  }

  static get MINIMUM_COLUMNS() {
    return 8;
  }

  constructor(iswSheet: Sheet) {
    const sheetName = iswSheet.getSheetName();
    if (sheetName[0] !== "_") {
      throw new Error(`${sheetName} is NOT an account sheet`);
    }
    this.sheet = iswSheet;
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
      this.convertColumnToUppercase(AccountSheet.COLUMNS.DESCRIPTION);
      this.convertColumnToUppercase(AccountSheet.COLUMNS.NOTE);
      this.setColumnWidth(AccountSheet.COLUMNS.DESCRIPTION, 500);
      this.setColumnWidth(AccountSheet.COLUMNS.NOTE, 170);
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
    const lastRow = this.sheet.getLastRow();
    const numRows = lastRow - START_ROW + 1;

    const range = this.sheet.getRange(START_ROW, column, numRows, 1);
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

  get spreadsheet() {
    return this.sheet.spreadsheet;
  }

  get spreadsheetName() {
    return this.sheet.spreadsheetName;
  }

  getExpectedHeader(column: number) {
    return column === AccountSheet.COLUMNS.DESCRIPTION
      ? this.xLookup(
          this.getSheetName().slice(1),
          this.sheet.getParent().getSheetByName(BankAccounts.SHEET.NAME),
          "A",
          "AQ"
        )
      : AccountSheet.HEADERS[column - 1];
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
    const rule = gasSpreadsheetApp
      .newDataValidation()
      .requireValueInRange(
        this.sheet.getParent().getRange(validationRange),
        true
      )
      .setAllowInvalid(false)
      .setHelpText("Please select a valid counterparty.")
      .build();

    range.setDataValidation(rule);
  }

  setDateValidation(a1range: string) {
    const range = this.sheet.getRange(a1range);
    const rule = gasSpreadsheetApp
      .newDataValidation()
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
    const headerRange = sheet.getRange(1, 1, 1, AccountSheet.MINIMUM_COLUMNS);
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
    const frozenRows = this.sheet.getFrozenRows();
    if (frozenRows !== 1) {
      throw new Error(`There should be 1 frozen row; found ${frozenRows}`);
    }
  }

  validateHeaders() {
    const headers = this.sheet
      .getRange(1, 1, 1, AccountSheet.MINIMUM_COLUMNS)
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
    const lastColumn = this.sheet.getLastColumn();
    if (lastColumn < AccountSheet.MINIMUM_COLUMNS) {
      throw new Error(
        `Sheet ${this.getSheetName()} requires at least ${
          AccountSheet.MINIMUM_COLUMNS
        } columns, but found ${lastColumn}`
      );
    }
  }

  validateSheet() {
    this.validateMinimumColumns();
    this.validateHeaders();
    this.validateFrozenRows();
  }

  xLookup(searchValue:string, sheet:Sheet, searchCol:string, resultCol:string) {
    const searchRange = sheet
      .getRange(`${searchCol}1:${searchCol}`)
      .getValues();
    for (let i = 0; i < searchRange.length; i++) {
      if (searchRange[i][0] === searchValue) {
        return sheet.getRange(`${resultCol}${i + 1}`).getValue();
      }
    }
    return null;
  }
}
