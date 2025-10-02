// Code.ts
// Application entry point – executed when the script is loaded.
import { FastLog } from "@logging/FastLog";
import * as GAS from "./gas/exports";
import { shimGlobals } from "./shimGlobals";

// Attach ALL GAS_* exports (covers both account + non-account)
for (const [key, fn] of Object.entries(GAS as Record<string, unknown>)) {
  if (typeof fn === "function" && key.startsWith("GAS_")) {
    (globalThis as any)[key] = fn;
  }
}

// ────────────────────────────────────────────────────────────
// Register trigger handlers
// ────────────────────────────────────────────────────────────
const globalsToExport: Record<string, unknown> = {};

for (const name of shimGlobals) {
  const key = `GAS_${name}`;
  const fn = (GAS as Record<string, unknown>)[key];
  if (typeof fn === "function") {
    globalsToExport[name] = fn;
  } else {
    FastLog.warn(`⚠️ GAS function not found: ${key}`);
  }
}

// Export this list for the shim generator
(globalThis as any).__exportedGlobals__ = Object.keys(globalsToExport).sort();
