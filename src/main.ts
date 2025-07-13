/// <reference types="google-apps-script" />

import { Spreadsheet } from "./Spreadsheet";
import { getSheetNamesByType, goToSheetLastRow } from "./functions";

/**
 * Application entry point – executed when the script is loaded.
 */

// ────────────────────────────────────────────────────────────
//  Locale (used elsewhere for date/number formatting)
// ────────────────────────────────────────────────────────────
export const LOCALE = "en-GB" as const;

// ────────────────────────────────────────────────────────────
//  Spreadsheet context
// ────────────────────────────────────────────────────────────
export const spreadsheet = Spreadsheet.from(); // active spreadsheet
export const gasSpreadsheetApp = spreadsheet.raw; // escape hatch if needed

// ────────────────────────────────────────────────────────────
//  Dynamically create helper functions
// ────────────────────────────────────────────────────────────
(() => {
  const accountSheetNames = getSheetNamesByType("account");

  // Produce a map like { dynamicAccountCash: () => void, … }
  const helpers: Record<string, () => void> = {};

  for (const name of accountSheetNames) {
    const key = `dynamicAccount${name}`;
    helpers[key] = () => goToSheetLastRow(name);
  }

  // Attach to global scope so they can be invoked directly from GAS
  Object.assign(globalThis, helpers);
})();
