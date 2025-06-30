/// <reference types="google-apps-script" />

import { OurFinances } from './OurFinances';
import { Sheet } from './Sheet';



class CheckFixedAmounts {
  // Column definitions using static getters
  static get COLUMNS() {
    return {
      TAX_YEAR: 0,
      CATEGORY: 1,
      FIXED_AMOUNT: 2,
      DYNAMIC_AMOUNT: 3,
      TOLERANCE: 4,
      MISMATCH: 5
    };
  };

  // Sheet configuration using static getters
  static get SHEET() {
    return {
      NAME: 'Check fixed amounts',
      MIN_COLUMNS: 6,  // Minimum expected columns
      HEADER_ROW: 1    // Number of header rows to skip
    };
  };

  /**
   * Creates an instance of CheckFixedAmounts.
   * @throws {Error} If sheet cannot be found or initialized
   */
  constructor() {
    try {
      this.sheet = new Sheet(CheckFixedAmounts.SHEET.NAME);
      this.validateSheetStructure();
    } catch (error) {
      throw new Error(`Sheet initialization failed: ${error.message}`);
    }
  }

  /**
     * Creates a mismatch message for a row
     * @private
     * @param {Array<any>} row - The row data
     * @return {string} Formatted mismatch message
     */
  createMismatchMessage(row) {
    const columns = CheckFixedAmounts.COLUMNS;

    return Utilities.formatString(
      '%s %s: Dynamic amount (%s) does not match fixed amount (%s)',
      row[columns.TAX_YEAR],
      row[columns.CATEGORY],
      getAmountAsGBP(row[columns.DYNAMIC_AMOUNT]),
      getAmountAsGBP(row[columns.FIXED_AMOUNT])
    );
  }

  getEmailBody() {
    return this.getMismatches().join(`\n`);
  }

  /**
     * Retrieves values from the sheet with caching
     * @private
     * @return {Array<Array<any>>} Sheet values
     * @throws {Error} If unable to get sheet values
     */
  getValues() {
    try {
      // Cache the values if not already cached
      if (!this.cachedValues) {
        const range = this.sheet.getDataRange();
        if (!range) {
          throw new Error('Could not get data range from sheet');
        }
        this.cachedValues = range.getValues();
      }
      return this.cachedValues;
    } catch (error) {
      throw new Error(`Could not retrieve sheet data: ${error.message}`);
    }
  }

  getMismatchMessages() {
    const mismatches = [];
    let mismatchMessages = [];
    const values = this.getValues();

    // Start after header row
    for (let i = CheckFixedAmounts.SHEET.HEADER_ROW; i < values.length; i++) {
      const row = values[i];

      // Skip invalid rows
      if (!this.isValidRow(row)) {
        mismatches.push({
          rowNumber: i + 1,
          message: `CheckFixedAmounts: Skipping invalid row`
        });
        continue;
      }

      if (row[CheckFixedAmounts.COLUMNS.MISMATCH] === 'Mismatch') {
        mismatches.push({
          rowNumber: i + 1,
          message: this.createMismatchMessage(row)
        });
      }
    };
    if (mismatches.length > 0) {
      mismatchMessages = mismatches
        .map(function (m) {
          return 'Row ' + m.rowNumber + ': ' + m.message;
        })
    }
    return mismatchMessages;
  }

  /**
     * Validates a single row of data
     * @private
     * @param {Array<any>} row - The row to validate
     * @return {boolean} Whether the row is valid
     */
  isValidRow(row) {
    const columns = CheckFixedAmounts.COLUMNS;

    return Boolean(
      row &&
      row.length >= CheckFixedAmounts.SHEET.MIN_COLUMNS &&
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
  validateSheetStructure() {
    const values = this.getValues();

    if (!values || !Array.isArray(values) || values.length <= CheckFixedAmounts.SHEET.HEADER_ROW) {
      throw new Error('Sheet is empty or contains insufficient data');
    }

    if (values[0].length < CheckFixedAmounts.SHEET.MIN_COLUMNS) {
      throw new Error(`Sheet must have at least ${CheckFixedAmounts.SHEET.MIN_COLUMNS} columns`);
    }
  }
}
