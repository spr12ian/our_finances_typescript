// Code.ts — minimal entry point
import { FastLog } from "@logging/FastLog";
import "./features/sheets/augmentAllSheets"; // side-effect: addCommonMethods to all sheet classes
import * as GAS from "./gas/exports";
import "./gas/exports/attachGASGlobals"; // side-effect: attaches all GAS_* to globalThis
import { shimGlobals } from "./shimGlobals";

(() => {
  const g = globalThis as any;
  const SIMPLE_TRIGGERS = new Set([
    "onOpen",
    "onEdit",
    "handleChange",
    "onSelectionChange",
  ]);

  // Expose selected names (from shimGlobals) without the GAS_ prefix for shim.gs wrappers
  const missing: string[] = [];

  for (const name of shimGlobals) {
    // Logger.log(`Processing global function: ${name}`);
    if (SIMPLE_TRIGGERS.has(name)) continue;
    // Logger.log(`Exporting GAS function for global: ${name}`);
    const key = `GAS_${name}`;
    const fn = (GAS as Record<string, unknown>)[key];
    if (typeof fn === "function") {
      g[name] = fn; // e.g. globalThis.balanceSheet -> GAS_balanceSheet
    } else {
      missing.push(key);
    }
  }

  if (missing.length) {
    FastLog.warn(`⚠️ GAS functions not found: ${missing.join(", ")}`);
  }

  // Keep a sorted list of what we actually exported (handy for sanity checks / menus)
  g.__exportedGlobals__ = shimGlobals
    .filter((n) => typeof (GAS as any)[`GAS_${n}`] === "function")
    .sort();
})();
