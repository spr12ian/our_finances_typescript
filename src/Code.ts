/// <reference types="google-apps-script" />
import { exportToGlobalThis } from "./exportToGlobal";
import * as GAS from "./gasExports";
import { getFinancesSpreadsheet } from "./getFinancesSpreadsheet";
import { OurFinances } from "./OurFinances";
import { registerDynamicAccountFunctions } from "./registerDynamicAccountFunctions";
import { shimGlobals } from "./shimGlobals";
// import { validateAllMenuFunctionNames } from "./validateAllMenuFunctionNames";
// import { FastLog } from './FastLog';

/**
 * Application entry point – executed when the script is loaded.
 */

// ────────────────────────────────────────────────────────────
//  Dynamically create account menu functions
// ────────────────────────────────────────────────────────────
(() => {
  const spreadsheet = getFinancesSpreadsheet();
  const accountSheetNames = new OurFinances(spreadsheet).spreadsheetSummary
    .accountSheetNames;
  registerDynamicAccountFunctions(accountSheetNames);
})();

// ────────────────────────────────────────────────────────────
// Register trigger handlers
// ────────────────────────────────────────────────────────────
const globalsToExport: Record<string, unknown> = {};

for (const name of shimGlobals) {
  const key = `GAS_${name}`;
  const fn = (GAS as Record<string, unknown>)[key];
  if (typeof fn === "function") {
    // @ts-expect-error: dynamic assignment to globalThis
    globalThis[key] = fn;
    globalsToExport[name] = fn;
  } else {
    console.warn(`⚠️ GAS function not found: ${key}`);
  }
}
exportToGlobalThis(globalsToExport);

// FastLog.log("✅ Global functions registered.");

// Export this list for the shim generator
(globalThis as any).__exportedGlobals__ = Object.keys(globalsToExport).sort();

// Object.keys(globalThis)
//   .sort()
//   .forEach((key) => {
//     FastLog.log(key);
//   });

// validateAllMenuFunctionNames();
