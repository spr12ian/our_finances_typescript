/// <reference types="google-apps-script" />

import { exportToGlobal } from "./exportToGlobal";
import { accountSheetNames, goToSheetLastRow, logTime } from "./functions";
import { onDateChange } from "./onDateChange";
import { onOpen } from "./onOpen";
function myScheduledTask():void {
  logTime("Hello!");
}
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

const exportedGlobals = {
  myScheduledTask,
  onDateChange,
  onOpen,
};
// ────────────────────────────────────────────────────────────
// Register trigger handlers
// ────────────────────────────────────────────────────────────
exportToGlobal(exportedGlobals);

console.log("✅ Global functions registered.");

// Export this list for the shim generator
(globalThis as any).__exportedGlobals__ = Object.keys(exportedGlobals);
