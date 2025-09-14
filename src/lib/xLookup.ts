import type { Sheet } from "../domain/Sheet";

/**
 * Custom XLOOKUP function for Google Apps Script
 *
 * @param {string|number} searchValue - The value you are searching for.
 * @param {Sheet} sheet - The sheet where the lookup is performed.
 * @param {string} searchCol - The column letter to search in (e.g., 'A').
 * @param {string} resultCol - The column letter for the result (e.g., 'B').
 * @param {boolean} [exactMatch=true] - Whether to look for exact matches.
 * @returns {string|number|null} The result of the lookup or null if not found.
 */
export function xLookup(
  searchValue: string | number,
  sheet: Sheet,
  searchCol: string,
  resultCol: string,
  exactMatch: boolean = true
) {
  const searchRange = sheet.getRange(`${searchCol}1:${searchCol}`).getValues();
  const resultRange = sheet.getRange(`${resultCol}1:${resultCol}`).getValues();

  for (let i = 0; i < searchRange.length; i++) {
    const cellValue = searchRange[i][0];

    // Handle exact or approximate match cases
    if (
      (exactMatch && cellValue === searchValue) ||
      (!exactMatch &&
        cellValue
          .toString()
          .toLowerCase()
          .includes(searchValue.toString().toLowerCase()))
    ) {
      return resultRange[i][0]; // Return the corresponding result value
    }
  }

  return null; // Return null if no match is found
}
