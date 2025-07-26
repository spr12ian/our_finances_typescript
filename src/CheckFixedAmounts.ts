/// <reference types="google-apps-script" />
import { MetaCheckFixedAmounts as Meta } from "./constants";
import { getAmountAsGBP } from "./MoneyUtils";
import type { Sheet } from "./Sheet";
import { Spreadsheet } from "./Spreadsheet";

export class CheckFixedAmounts {
  private readonly sheet: Sheet;
  #values?: any[][];

  constructor(
    private readonly spreadsheet: Spreadsheet = Spreadsheet.getActive()
  ) {
    this.sheet = this.spreadsheet.getSheet(Meta.SHEET.NAME);
    this.validateSheetStructure();
  }

  /**
   * Creates a mismatch message for a row
   * @private
   * @param {Array<any>} row - The row data
   * @return {string} Formatted mismatch message
   */
  createMismatchMessage(row: any[]): string {
    const columns = Meta.COLUMNS;

    return Utilities.formatString(
      "%s %s: Dynamic amount (%s) does not match fixed amount (%s)",
      row[columns.TAX_YEAR],
      row[columns.CATEGORY],
      getAmountAsGBP(row[columns.DYNAMIC_AMOUNT]),
      getAmountAsGBP(row[columns.FIXED_AMOUNT])
    );
  }

  private get allValues(): any[][] {
    try {
      // Cache the values if not already cached
      if (!this.#values) {
        const range = this.sheet.getDataRange();
        if (!range) {
          throw new Error("Could not get data range from sheet");
        }
        this.#values = range.getValues();
      }
      return this.#values;
    } catch (error) {
      let message = "Unknown error accessing '" + Meta.SHEET.NAME + "'";
      if (error instanceof Error) {
        message = error.message;
      }
      throw new Error(`Could not retrieve sheet data: ${message}`);
    }
  }

  get mismatchMessages(): string[] {
    const mismatches = [];
    let mismatchMessages: string[] = [];
    const values = this.allValues;

    // Start after header row
    for (let i = Meta.SHEET.HEADER_ROW; i < values.length; i++) {
      const row = values[i];

      // Skip invalid rows
      if (!this.isValidRow(row)) {
        mismatches.push({
          rowNumber: i + 1,
          message: `CheckFixedAmounts: Skipping invalid row`,
        });
        continue;
      }

      if (row[Meta.COLUMNS.MISMATCH] === "Mismatch") {
        mismatches.push({
          rowNumber: i + 1,
          message: this.createMismatchMessage(row),
        });
      }
    }
    if (mismatches.length > 0) {
      mismatchMessages = mismatches.map(function (m) {
        return "Row " + m.rowNumber + ": " + m.message;
      });
    }
    return mismatchMessages;
  }

  /**
   * Validates a single row of data
   * @private
   * @param {Array<any>} row - The row to validate
   * @return {boolean} Whether the row is valid
   */
  isValidRow(row: any[]): boolean {
    const columns = Meta.COLUMNS;

    return !!(
      row &&
      row.length >= Meta.SHEET.MIN_COLUMNS &&
      row[columns.CATEGORY] &&
      !isNaN(Number(row[columns.DYNAMIC_AMOUNT])) &&
      !isNaN(Number(row[columns.FIXED_AMOUNT]))
    );
  }

  /**
   * Validates the basic structure of the sheet
   * @private
   * @throws {Error} If sheet structure is invalid
   */
  validateSheetStructure(): void {
    const values = this.allValues;

    if (
      !values ||
      !Array.isArray(values) ||
      values.length <= Meta.SHEET.HEADER_ROW
    ) {
      throw new Error("Sheet is empty or contains insufficient data");
    }

    if (values[0].length < Meta.SHEET.MIN_COLUMNS) {
      throw new Error(
        `Sheet must have at least ${Meta.SHEET.MIN_COLUMNS} columns`
      );
    }
  }
}
