/// <reference types="google-apps-script" />
import { exportToGlobalThis } from "./exportToGlobal";
import { accountSheetNames, goToSheetLastRow } from "./functions";
import * as GAS from "./gasExports";
import { shimGlobals } from "./shimGlobals";
import { registerDynamicAccountFunctions } from "./registerDynamicAccountFunctions";
/**
 * Application entry point – executed when the script is loaded.
 */

// ────────────────────────────────────────────────────────────
//  Dynamically create account menu functions
// ────────────────────────────────────────────────────────────
(() => {
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

console.log("✅ Global functions registered.");

// Export this list for the shim generator
(globalThis as any).__exportedGlobals__ = Object.keys(globalsToExport).sort();

Object.keys(globalThis).sort().forEach((key) => {
  console.log(key);
});

