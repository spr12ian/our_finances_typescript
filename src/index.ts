/// <reference types="google-apps-script" />

import { Spreadsheet } from "./Spreadsheet";
import { exportToGlobal } from "./exportToGlobal";
import { accountSheetNames, goToSheetLastRow } from "./functions";
import { onDateChange } from "./onDateChange";
import { onOpen } from "./onOpen";

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
export const activeSpreadsheet = Spreadsheet.from(); // active spreadsheet
export const gasSpreadsheetApp = activeSpreadsheet.raw; // escape hatch if needed

// ────────────────────────────────────────────────────────────
//  Dynamically create helper functions
// ────────────────────────────────────────────────────────────
(() => {
  // Produce a map like { dynamicAccountCash: () => void, … }
  const helpers: Record<string, () => void> = {};

  for (const name of accountSheetNames) {
    const key = `dynamicAccount${name}`;
    helpers[key] = () => goToSheetLastRow(name);
  }

  // Attach to global scope so they can be invoked directly from GAS
  exportToGlobal({ helpers });
})();

// ────────────────────────────────────────────────────────────
// Register trigger handlers
// ────────────────────────────────────────────────────────────
exportToGlobal({
  onDateChange,
  onOpen,
});
