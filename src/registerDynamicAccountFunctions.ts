/// <reference types="google-apps-script" />

import { goToSheetLastRow } from "./goToSheetLastRow";
import { FastLog } from "./lib/FastLog";

/**
 * Registers `dynamicAccount_*` functions on `globalThis`
 * so they are available to Google Apps Script.
 *
 * Each function activates the last row of the given sheet.
 *
 * Example: `dynamicAccount_AHALIF()` activates `_AHALIF` sheet last row.
 */
export function registerDynamicAccountFunctions(
  accountSheetNames: string[]
): void {
  for (const name of accountSheetNames) {
    const functionName = `dynamicAccount${name}`;

    // Ensure we don’t overwrite existing global properties
    if (Object.prototype.hasOwnProperty.call(globalThis, functionName)) {
      FastLog.warn(`⚠️ Skipping existing function: ${functionName}`);
      continue;
    }

    (globalThis as any)[functionName] = () => goToSheetLastRow(name);
  }
}
