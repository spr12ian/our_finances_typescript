import type { Sheet, Spreadsheet } from "@domain";
import { convertColumnToUppercase } from "@gas/convertColumnToUppercase";
import { MetaAccountSheet as Meta, MetaBankAccounts } from "@lib/constants";
import { getErrorMessage } from "@lib/errors";
import { FastLog, WithLog } from "@lib/logging";
import { xLookup } from "@lib/xLookup";
import { DescriptionReplacements } from "@sheets/classes/DescriptionReplacements";
import { BaseSheet } from "../core";

const COLOR_FUTURE_ROWS = "#D0E0E3";

export class AccountSheet extends BaseSheet {
  constructor(readonly sheet: Sheet, readonly spreadsheet: Spreadsheet) {
    FastLog.log(`AccountSheet: constructor for sheet ${sheet.name}`);
    if (sheet.name[0] !== "_") {
      throw new Error(`${sheet.name} is NOT an account sheet`);
    }

    super(sheet.name, spreadsheet);
  }

  get accountKey(): string {
    return this.sheetName.slice(1);
  }

  get currentEndingBalance(): number {
    const lastRow = this.lastNonFutureRow;
    FastLog.log(
      `AccountSheet:currentEndingBalance: ${this.accountKey} lastNonFutureRow=${lastRow}`
    );
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
      this.warn(
        `currentEndingBalance not numeric at row ${lastRow}: ${String(v)}`
      );
      return 0; // or: throw new Error("Balance is not numeric")
    }

    return n;
  }

  get lastNonFutureRow(): number {
    const values = this.sheet.getRange("E:E").getValues();
    for (let i = values.length - 1; i >= 0; i--) {
      const val = values[i][0];
      if (val.toString().trim().toUpperCase() !== "FUTURE") {
        return i + 1; // 1-indexed row
      }
    }
    return 0; // if every cell is 'FUTURE'
  }

  @WithLog("AccountSheet.applyDescriptionReplacements")
  applyDescriptionReplacements() {
    const descriptionReplacements = new DescriptionReplacements(
      this.spreadsheet
    );
    descriptionReplacements.applyReplacements(this.sheet);
  }

  convertColumnToUppercase(column: number) {
    convertColumnToUppercase(this.sheet.raw, column);
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
    this.accountSheetBalanceValues();
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
    const methodName = this.formatSheet.name;
    const finish = this.start(methodName);
    const sheet = this.sheet;
    try {
      sheet.formatSheet();
      this.addDefaultNotes();
      this.formatFutureRows();
      this.setColumnWidths(sheet);
      return;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      this.error(methodName, err);
      throw new Error(errorMessage);
    } finally {
      finish();
    }
  }

  getFutureRowsRanges() {
    return this.sheet.getRangesWhereColumnEquals(Meta.COLUMNS.NOTE, "FUTURE");
  }

  handleEditTrigger() {
    this.log("AccountSheet.handleEditTrigger");
  }

  accountSheetBalanceValues(rowEdited?: number): void {
    const methodName = this.accountSheetBalanceValues.name;
    const finish = this.start(methodName);
    try {
      const COLUMNS = Meta.COLUMNS;
      const ROW_DATA_STARTS = Meta.ROW_DATA_STARTS;
      const gasSheet = this.sheet.raw;

      // Clamp to first data row
      const row = Math.max(ROW_DATA_STARTS, rowEdited ?? ROW_DATA_STARTS);
      const lastRow = gasSheet.getLastRow();
      let len = Math.max(0, lastRow - row + 1);
      if (len === 0) {
        this.log(`No data rows for ${this.accountKey}`);
        return;
      }

      // Seed running balance from previous row’s BALANCE (or 0 if first data row)
      const toPennies = (v: unknown) => Math.round((Number(v) || 0) * 100);
      let balP = 0;
      if (row > ROW_DATA_STARTS) {
        const seed = gasSheet.getRange(row - 1, COLUMNS.BALANCE).getValue();
        balP = toPennies(seed);
      }

      // ─────────────────────────────────────────────
      // Bulk-read CREDIT, DEBIT, BALANCE in one call
      // ─────────────────────────────────────────────
      const firstCol = Math.min(COLUMNS.CREDIT, COLUMNS.DEBIT, COLUMNS.BALANCE);
      const lastCol = Math.max(COLUMNS.CREDIT, COLUMNS.DEBIT, COLUMNS.BALANCE);
      const width = lastCol - firstCol + 1;

      const data = gasSheet.getRange(row, firstCol, len, width).getValues();

      const creditIdx = COLUMNS.CREDIT - firstCol;
      const debitIdx = COLUMNS.DEBIT - firstCol;
      const balanceIdx = COLUMNS.BALANCE - firstCol;

      // Optionally shrink len down to last non-empty CREDIT/DEBIT/BALANCE row
      let effectiveLen = len;
      for (let i = len - 1; i >= 0; i--) {
        const r = data[i];
        if (r[creditIdx] !== "" || r[debitIdx] !== "" || r[balanceIdx] !== "") {
          effectiveLen = i + 1;
          break;
        }
      }

      if (effectiveLen === 0) {
        this.log(`All trailing rows empty for ${this.accountKey}`);
        return;
      }

      const output: number[][] = new Array(effectiveLen);
      let firstDiffIndex = -1;

      for (let i = 0; i < effectiveLen; i++) {
        const rowVals = data[i];
        const creditP = toPennies(rowVals[creditIdx]);
        const debitP = toPennies(rowVals[debitIdx]);
        const currentBalanceP = toPennies(rowVals[balanceIdx]);

        balP += creditP - debitP;
        const newBalance = balP / 100;

        output[i] = [newBalance];

        if (firstDiffIndex === -1 && currentBalanceP !== balP) {
          firstDiffIndex = i;
        }
      }

      if (firstDiffIndex === -1) {
        this.log(`No changes to balance for ${this.accountKey}`);
        return;
      }

      const slice = output.slice(firstDiffIndex);

      gasSheet
        .getRange(row + firstDiffIndex, COLUMNS.BALANCE, slice.length, 1)
        .setValues(slice);
    } catch (err) {
      const errorMessage = `Error in ${methodName}: ${getErrorMessage(err)}`;
      FastLog.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      // Always complete logging/timing
      finish();
    }
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
    const finish = this.start(this.setColumnWidths.name);
    try {
      const dateWidth = this.getColumnWidth(Meta.COLUMNS.DATE);
      this.log(`dateWidth: ${dateWidth}`);

      sheet.raw
        .setColumnWidth(Meta.COLUMNS.DATE, Meta.COLUMN_WIDTHS.DATE)
        .setColumnWidth(
          Meta.COLUMNS.DESCRIPTION,
          Meta.COLUMN_WIDTHS.DESCRIPTION
        )
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
    } finally {
      finish();
    }
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
