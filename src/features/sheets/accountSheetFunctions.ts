import type { Sheet, Spreadsheet } from "@domain";
import { ACCOUNT_PREFIX } from "@lib/constants";

let cachedAccountSheets: Sheet[] | null = null;
let cachedAccountSheetKeys: string[] | null = null;
let cachedAccountSheetNames: string[] | null = null;

/**
 * Retrieves all account sheets (names start with the defined prefix).
 * Uses caching to avoid recomputation. Pass `true` to force refresh.
 */
export function getAccountSheets(
  spreadsheet: Spreadsheet,
  forceRefresh = false
): Sheet[] {
  if (!forceRefresh && cachedAccountSheets !== null) {
    return cachedAccountSheets;
  }
  cachedAccountSheets = spreadsheet.sheets.filter((sheet) =>
    sheet.name.startsWith(ACCOUNT_PREFIX)
  );

  return cachedAccountSheets;
}

/**
 * Retrieves all account sheet keys (sheetName minus leading underscore).
 * Uses caching to avoid recomputation. Pass `true` to force refresh.
 */
export function getAccountSheetKeys(
  spreadsheet: Spreadsheet,
  forceRefresh = false
): string[] {
  if (!forceRefresh && cachedAccountSheetKeys !== null) {
    return cachedAccountSheetKeys;
  }
  cachedAccountSheetKeys = getAccountSheets(spreadsheet, forceRefresh).map(
    (sheet) => sheet.name.slice(1)
  );

  return cachedAccountSheetKeys;
}

/**
 * Retrieves all account sheet names starting with the defined prefix.
 * Uses caching to avoid recomputation. Pass `true` to force refresh.
 */
export function getAccountSheetNames(
  spreadsheet: Spreadsheet,
  forceRefresh = false
): string[] {
  if (!forceRefresh && cachedAccountSheetNames !== null) {
    return cachedAccountSheetNames;
  }
  cachedAccountSheetNames = getAccountSheets(spreadsheet, forceRefresh).map(
    (sheet) => sheet.name
  );

  return cachedAccountSheetNames;
}

export function isAccountSheet(sheet: Sheet) {
  return isAccountSheetName(sheet.name);
}

export function isAccountSheetName(sheetName: string) {
  return sheetName && sheetName.startsWith(ACCOUNT_PREFIX);
}
