/// <reference types="google-apps-script" />
import { SHEET } from "./MetaHMRC_S";
import { columnNumberToLetter } from "./NumberUtils";
export class HMRC_S {
  // Column definitions using static getters
  static get COLUMNS() {
    return {
      QUESTIONS: 0,
      CATEGORY: 1,
      LATEST_TAX_YEAR: 2,
    };
  }

  // Sheet configuration using static getters
  static get SHEET() {
    return SHEET;
  }

  // Handles the edit event
  handleEdit(trigger) {
    try {
      const value = trigger.getValue();
      const row = trigger.getRow();
      const column = trigger.getColumn();

      // Exit early if value is empty or row is part of the header
      if (!value || row <= HMRC_S.SHEET.HEADER_ROW) return;

      // Check if the edit occurred in the "CATEGORY" column
      if (column === HMRC_S.COLUMNS.CATEGORY + 1) {
        const sheet = trigger.getSheet();
        const startColLetter = columnNumberToLetter(
          HMRC_S.COLUMNS.LATEST_TAX_YEAR + 1
        );
        const lastColLetter = columnNumberToLetter(sheet.getLastColumn());

        // Construct QUERY formulas
        const queries = this.buildQueries(
          value,
          startColLetter,
          lastColLetter,
          row
        );

        // Set the formulas in the target range
        const targetRange = `${startColLetter}${row}:${lastColLetter}${row}`;
        sheet.getRange(targetRange).setValues([queries]);
      }
    } catch (error) {
      console.error("Error handling handleEdit:", error);
    }
  }

  // Build QUERY formulas for the given range
  buildQueries(value, startCol, lastCol, row) {
    const baseQuery = `=IFNA(QUERY(Transactions!$A$2:$Z, `;
    const labelSuffix = ` LABEL SUM(I) ''"), 0.0)`;

    const queries = [];
    for (let col = startCol; col <= lastCol; col = this.nextColumnLetter(col)) {
      const query = `${baseQuery}"SELECT SUM(I) WHERE J='"&$${col}$1&"' AND M='${HMRC_S.SHEET.NAME} ${value}'${labelSuffix}`;
      queries.push(query);
    }
    return queries;
  }

  // Calculate the next column letter (e.g., A -> B)
  nextColumnLetter(col) {
    let carry = 1;
    let result = "";
    for (let i = col.length - 1; i >= 0; i--) {
      const code = col.charCodeAt(i) + carry;
      if (code > 90) {
        result = "A" + result;
        carry = 1;
      } else {
        result = String.fromCharCode(code) + result;
        carry = 0;
      }
    }
    return carry ? "A" + result : result;
  }
}
