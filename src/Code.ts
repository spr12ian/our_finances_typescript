/// <reference types="google-apps-script" />
import { exportToGlobalThis } from "./exportToGlobal";
import * as GAS from "./gas/exports";
import { FastLog } from "./lib/FastLog";
import { shimGlobals } from "./shimGlobals";

/**
 * Application entry point – executed when the script is loaded.
 */

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
    FastLog.warn(`⚠️ GAS function not found: ${key}`);
  }
}
exportToGlobalThis(globalsToExport);

// FastLog.log("✅ Global functions registered.");

// Export this list for the shim generator
(globalThis as any).__exportedGlobals__ = Object.keys(globalsToExport).sort();
