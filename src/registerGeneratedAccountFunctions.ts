/// <reference types="google-apps-script" />

import { FastLog } from "@logging/FastLog";
import { goToSheetLastRow } from "./goToSheetLastRow";

/**
 * Registers `dynamicAccount_*` functions on `globalThis`
 * so they are available to Google Apps Script.
 *
 * Each function activates the last row of the given sheet.
 *
 * Example: `dynamicAccount_AHALIF()` activates `_AHALIF` sheet last row.
 */
export function registerGeneratedAccountFunctions(
  accountSheetNames: string[]
): void {
  const fn = registerGeneratedAccountFunctions.name;
  const startTime = FastLog.start(fn);

  try {
    for (const name of accountSheetNames) {
      const functionName = `goToSheetLastRow${name}`;
      FastLog.log(fn, `functionName: ${functionName}`);

      // Ensure we don’t overwrite existing global properties
      if (Object.prototype.hasOwnProperty.call(globalThis, functionName)) {
        FastLog.warn(`⚠️ Skipping existing function: ${functionName}`);
        continue;
      }

      (globalThis as any)[functionName] = () => goToSheetLastRow(name);
    }
  } finally {
    FastLog.finish(fn, startTime);
  }
}
