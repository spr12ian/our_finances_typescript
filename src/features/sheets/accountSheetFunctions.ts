// src/features/sheets/accountSheetFunctions.ts

import type { Sheet, Spreadsheet } from "@domain";
import { ACCOUNT_PREFIX } from "@lib/constants";
import { getFinancesSpreadsheet } from "src/getFinancesSpreadsheet";

let cachedAccountSheets: Sheet[] | null = null;
let cachedAccountSheetKeys: string[] | null = null;
let cachedAccountSheetNames: string[] | null = null;

const PROP_KEY_NAMES = "ACCOUNT_SHEET_NAMES_JSON";
const PROP_KEY_META  = "ACCOUNT_SHEET_NAMES_META_JSON"; // { lastUpdated:number, count:number }

// ---- helpers ---------------------------------------------------------------

/** Use DocumentProperties so cache is per-spreadsheet (safer if you reuse the code on other files). */
function getDocProps(): GoogleAppsScript.Properties.Properties {
  return PropertiesService.getDocumentProperties();
}

function safeParseJSON<T>(text: string | null): T | null {
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

// ---- core readers ----------------------------------------------------------

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
 * Returns account sheet names. If `forceRefresh` false, it will try DocumentProperties first,
 * fallback to recomputing + storing if nothing is cached.
 */
export function getAccountSheetNames(
  spreadsheet: Spreadsheet,
  forceRefresh = false
): string[] {
  if (!forceRefresh && cachedAccountSheetNames !== null) {
    return cachedAccountSheetNames;
  }

  if (!forceRefresh) {
    const fromProps = loadAccountSheetNamesFromProperties();
    if (fromProps && fromProps.length) {
      cachedAccountSheetNames = fromProps;
      return cachedAccountSheetNames;
    }
    // No cache available → compute and store
  }

  cachedAccountSheetNames = getAccountSheets(spreadsheet, true).map((s) => s.name);
  persistAccountSheetNames(cachedAccountSheetNames);
  return cachedAccountSheetNames;
}

export function isAccountSheet(sheet: Sheet) {
  return isAccountSheetName(sheet.name);
}

export function isAccountSheetName(sheetName: string) {
  return !!sheetName && sheetName.startsWith(ACCOUNT_PREFIX);
}

// ---- persistence API -------------------------------------------------------

/**
 * Computes names from the live spreadsheet and stores them in DocumentProperties.
 * Returns the list of names.
 */
export function storeAccountSheetNames(): string[] {
  const spreadsheet = getFinancesSpreadsheet();
  const names = getAccountSheetNames(spreadsheet, true); // recompute
  // getAccountSheetNames already persisted; but ensure once more in case impl changes
  persistAccountSheetNames(names);
  return names;
}

/** Lightweight loader from DocumentProperties (no recompute). Returns [] if none. */
function loadAccountSheetNamesFromProperties(): string[] {
  const props = getDocProps();
  const names = safeParseJSON<string[]>(props.getProperty(PROP_KEY_NAMES));
  return Array.isArray(names) ? names : [];
}

/** Internal persist helper that also writes basic metadata. */
function persistAccountSheetNames(names: string[]): void {
  const props = getDocProps();
  props.setProperty(PROP_KEY_NAMES, JSON.stringify(names));
  props.setProperty(
    PROP_KEY_META,
    JSON.stringify({ lastUpdated: Date.now(), count: names.length })
  );
}

/** Optional: call this from a time-based trigger to refresh daily/hourly. */
export function refreshAccountSheetNamesCache(): { count: number; lastUpdated: number } {
  const spreadsheet = getFinancesSpreadsheet();
  const names = getAccountSheetNames(spreadsheet, true); // recompute + persist
  const now = Date.now();
  const props = getDocProps();
  props.setProperty(PROP_KEY_META, JSON.stringify({ lastUpdated: now, count: names.length }));
  return { count: names.length, lastUpdated: now };
}
