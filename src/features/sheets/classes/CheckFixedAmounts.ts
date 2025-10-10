/// <reference types="google-apps-script" />
import type { Sheet, Spreadsheet } from "@domain";
import { col0 } from "@lib/columns";
import { MetaCheckFixedAmounts as Meta } from "@lib/constants";
import { getAmountAsGBP } from "../../../lib/money";
type Row = readonly any[]; // Narrow further if you control the sheet schema
type Values = readonly Row[];

const COL0 = {
  TAX_YEAR: col0(Meta.COLUMNS, "TAX_YEAR"),
  CATEGORY: col0(Meta.COLUMNS, "CATEGORY"),
  DYNAMIC_AMOUNT: col0(Meta.COLUMNS, "DYNAMIC_AMOUNT"),
  FIXED_AMOUNT: col0(Meta.COLUMNS, "FIXED_AMOUNT"),
  MISMATCH: col0(Meta.COLUMNS, "MISMATCH"),
} as const;

const HEADER_ROW_IDX = Meta.SHEET.HEADER_ROW; // e.g. 1 means header is row 1
const DATA_START_IDX = HEADER_ROW_IDX; // 0-based array index where data begins

const MISMATCH_FLAG = "Mismatch" as const;

export class CheckFixedAmounts {
  private readonly sheet: Sheet;
  #values?: Values;

  constructor(private readonly spreadsheet: Spreadsheet) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
    this.validateSheetStructure(); // will populate cache on first access
  }

  /** Lazily reads and caches all values (including header row). */
  private get allValues(): Values {
    if (!this.#values) {
      const range = this.sheet.dataRange;
      if (!range) throw new Error("Could not get data range from sheet");
      this.#values = range.getValues() as Values;
    }
    return this.#values;
  }

  /** Returns formatted messages for rows flagged as mismatches. */
  get mismatchMessages(): string[] {
    const values = this.allValues;
    if (values.length <= DATA_START_IDX) return [];

    const msgs: string[] = [];
    for (let i = DATA_START_IDX; i < values.length; i++) {
      const row = values[i];
      if (!this.isValidRow(row)) {
        // Optional: keep or remove this diagnostic line
        msgs.push(`Row ${i + 1}: CheckFixedAmounts: Skipping invalid row`);
        continue;
      }

      if (String(row[COL0.MISMATCH]) === MISMATCH_FLAG) {
        msgs.push(`Row ${i + 1}: ${this.createMismatchMessage(row)}`);
      }
    }
    return msgs;
  }

  /**
   * Creates a mismatch message for a row
   * Example: "2024–25 Utilities: Dynamic amount (£123.45) does not match fixed amount (£120.00)"
   */
  createMismatchMessage(row: Row): string {
    return Utilities.formatString(
      "%s %s: Dynamic amount (%s) does not match fixed amount (%s)",
      row[COL0.TAX_YEAR],
      row[COL0.CATEGORY],
      getAmountAsGBP(row[COL0.DYNAMIC_AMOUNT]),
      getAmountAsGBP(row[COL0.FIXED_AMOUNT])
    );
  }

  /** Basic row sanity check (shape + numeric amounts). */
  isValidRow(row: Row): boolean {
    if (!row || row.length < Meta.SHEET.MIN_COLUMNS) return false;

    const dyn = Number(row[COL0.DYNAMIC_AMOUNT]);
    const fix = Number(row[COL0.FIXED_AMOUNT]);

    return (
      row[COL0.CATEGORY] !== "" && !Number.isNaN(dyn) && !Number.isNaN(fix)
    );
  }

  /** Ensures we have at least a header row and minimum columns. Throws if invalid. */
  validateSheetStructure(): void {
    const values = this.allValues;
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("Sheet is empty or contains insufficient data");
    }
    const header = values[0];
    if (!Array.isArray(header) || header.length < Meta.SHEET.MIN_COLUMNS) {
      throw new Error(
        `Sheet must have at least ${Meta.SHEET.MIN_COLUMNS} columns`
      );
    }
    // Optional: verify header labels here if Meta.HEADERS exists.
  }
}
