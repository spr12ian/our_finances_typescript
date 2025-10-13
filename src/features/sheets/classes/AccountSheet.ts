import type { Sheet, Spreadsheet } from "@domain";
import { MetaAccountSheet as Meta, MetaBankAccounts } from "@lib/constants";
import { getErrorMessage } from "@lib/errors";
import { xLookup } from "@lib/xLookup";
import { FastLog, methodStart } from "@logging/FastLog";
import { DescriptionReplacements } from "@sheets/classes/DescriptionReplacements";
import { BaseSheet } from "../core";

const COLOR_FUTURE_ROWS = "#D0E0E3";
export class AccountSheet extends BaseSheet {
  constructor(readonly sheet: Sheet, readonly spreadsheet: Spreadsheet) {
    if (sheet.name[0] !== "_") {
      throw new Error(`${sheet.name} is NOT an account sheet`);
    }

    super(sheet.name, spreadsheet);
  }

  get accountKey(): string {
    return this.sheetName.slice(1);
  }

  get currentEndingBalance(): number {
    const { lastRow } = this.sheet.getTrueDataBounds();
    const v = this.sheet.raw.getRange(lastRow, Meta.COLUMNS.BALANCE).getValue();

    // Coerce to number safely
    let n: number;

    if (typeof v === "number") {
      n = v;
    } else if (typeof v === "string") {
      // Strip currency symbols, commas, spaces
      const cleaned = v.replace(/[^\d.+-]/g, "");
      n = cleaned.length ? Number(cleaned) : NaN;
    } else {
      n = NaN; // dates/booleans/blank -> not usable as a balance
    }

    if (!Number.isFinite(n)) {
      // Log and normalise to 0 (or throw if you prefer)
      FastLog.warn(
        `currentEndingBalance not numeric at row ${lastRow}: ${String(v)}`
      );
      return 0; // or: throw new Error("Balance is not numeric")
    }

    return n;
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
      this.accountKey,
      this.spreadsheet.getSheet(MetaBankAccounts.SHEET.NAME),
      "A",
      "AP"
    );
    const description = `Description (${label}) ${this.accountKey}`;
    const headers = [Meta.HEADERS];
    headers[0][Meta.COLUMNS.DESCRIPTION - 1] = description;
    headerRange.setValues(headers);
  }

  fixSheet() {
    this.validateSheet();
    this.updateAccountSheetBalances();
    this.convertColumnsToUppercase();

    this.setDataValidations();

    this.fixHeaders();
    this.formatSheet();
    this.trimSheet();

    const lastRow = this.sheet.getTrueDataBounds().lastRow;
    this.sheet.setActiveRange(this.sheet.raw.getRange(lastRow, 1));
  }

  formatFutureRows(): void {
    const futureRowsRanges = this.getFutureRowsRanges();
    if (futureRowsRanges) {
      futureRowsRanges.forEach((r) => r.setBackground(COLOR_FUTURE_ROWS));
    }
  }

  formatSheet() {
    const fn = this.formatSheet.name;
    const finish = methodStart(fn, this.accountKey);
    const sheet = this.sheet;
    try {
      sheet.formatSheet();
      this.addDefaultNotes();
      this.formatFutureRows();
      this.setColumnWidths(sheet);
      return;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      FastLog.error(fn, err);
      throw new Error(errorMessage);
    } finally {
      finish();
    }
  }

  getFutureRowsRanges() {
    return this.sheet.getRangesWhereColumnEquals(Meta.COLUMNS.NOTE, "FUTURE");
  }

  handleEditTrigger() {
    FastLog.log("AccountSheet.handleEditTrigger");
  }

  updateAccountSheetBalances(rowEdited?: number): void {
    const finish = methodStart(
      this.updateAccountSheetBalances.name,
      this.accountKey
    );
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
      FastLog.log(`No changes to balance for ${this.accountKey}`);
      return;
    }

    const slice = output.slice(firstDiffIndex);
    gasSheet
      .getRange(row + firstDiffIndex, COLUMNS.BALANCE, slice.length, 1)
      .setValues(slice);

    finish();
  }

  private addDefaultNotes() {
    this.setCellNote("F1", "Counterparty");
    this.setCellNote("G1", "Counterparty date");
  }

  private convertColumnsToUppercase() {
    if (this.sheetName !== "_SVI2TJ" && this.sheetName !== "_SVIIRF") {
      this.convertColumnToUppercase(Meta.COLUMNS.DESCRIPTION);
      this.convertColumnToUppercase(Meta.COLUMNS.NOTE);
    }
  }

  private setColumnWidths(sheet: Sheet) {
    sheet.raw
      .setColumnWidth(Meta.COLUMNS.DATE, Meta.COLUMN_WIDTHS.DATE)
      .setColumnWidth(Meta.COLUMNS.DESCRIPTION, Meta.COLUMN_WIDTHS.DESCRIPTION)
      .setColumnWidth(Meta.COLUMNS.CREDIT, Meta.COLUMN_WIDTHS.CREDIT)
      .setColumnWidth(Meta.COLUMNS.DEBIT, Meta.COLUMN_WIDTHS.DEBIT)
      .setColumnWidth(Meta.COLUMNS.NOTE, Meta.COLUMN_WIDTHS.NOTE)
      .setColumnWidth(
        Meta.COLUMNS.COUNTERPARTY,
        Meta.COLUMN_WIDTHS.COUNTERPARTY
      )
      .setColumnWidth(
        Meta.COLUMNS.COUNTERPARTY_DATE,
        Meta.COLUMN_WIDTHS.COUNTERPARTY_DATE
      )
      .setColumnWidth(Meta.COLUMNS.BALANCE, Meta.COLUMN_WIDTHS.BALANCE);
  }

  private setCounterpartyValidation(a1range: string) {
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

  private setDataValidations() {
    const sheet = this.sheet;
    const dataRange = sheet.dataRange;

    dataRange.clearDataValidations();

    this.setCounterpartyValidation("F2:F");
    // sheet.setNumberFormatAsDate("A2:A", "G2:G");
    // sheet.setNumberFormatAsUKCurrency("C2:D", "H2:H");
  }

  private validateFrozenRows() {
    const frozenRows = this.sheet.raw.getFrozenRows();
    if (frozenRows !== 1) {
      throw new Error(`There should be 1 frozen row; found ${frozenRows}`);
    }
  }

  private validateMinimumColumns() {
    const lastColumn = this.sheet.raw.getLastColumn();
    if (lastColumn < Meta.MINIMUM_COLUMNS) {
      throw new Error(
        `Sheet ${this.sheetName} requires at least ${Meta.MINIMUM_COLUMNS} columns, but found ${lastColumn}`
      );
    }
  }

  private validateSheet() {
    this.validateMinimumColumns();
    this.validateFrozenRows();
  }
}
