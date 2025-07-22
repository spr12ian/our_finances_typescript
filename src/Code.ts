/// <reference types="google-apps-script" />

import { exportToGlobal } from "./exportToGlobal";
import { accountSheetNames, goToSheetLastRow } from "./functions";
import { shimGlobals } from "./shimGlobals";
/**
 * Application entry point – executed when the script is loaded.
 */

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
const globalsToExport: Record<string, unknown> = {};

for (const name of shimGlobals) {
  const globalKey = `GAS${name}`;
  const fn = (globalThis as any)[globalKey];
  if (typeof fn === "function") {
    globalsToExport[name] = fn;
  } else {
    console.warn(`⚠️ Skipping export: ${globalKey} is not a function`);
  }
}
exportToGlobal(globalsToExport);

console.log("✅ Global functions registered.");

// Export this list for the shim generator
(globalThis as any).__exportedGlobals__ = Object.keys(globalsToExport);
