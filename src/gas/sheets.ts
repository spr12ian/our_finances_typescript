/// <reference types="google-apps-script" />

/**
 * Type guard to check if a value is a Google Sheets Sheet object.
 */
export function isGasSheet(
  obj: unknown
): obj is GoogleAppsScript.Spreadsheet.Sheet {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as GoogleAppsScript.Spreadsheet.Sheet).getSheetName ===
      "function" &&
    typeof (obj as GoogleAppsScript.Spreadsheet.Sheet).getRange === "function"
  );
}
