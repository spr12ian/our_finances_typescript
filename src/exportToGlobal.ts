/**
 * Makes given functions or values globally accessible to Apps Script
 * by assigning them to `globalThis`.
 *
 * Usage:
 *   exportToGlobal({ onOpen, doGet, myFunction });
 */
export function exportToGlobalThis(globals: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(globals)) {
    if (typeof value === "function") {
      // Functions can be called directly from GAS
      (globalThis as any)[key] = value;
    } else {
      // Allow exposing other values if needed (objects, constants, etc.)
      Object.defineProperty(globalThis, key, {
        value,
        writable: false,
        enumerable: true,
        configurable: false,
      });
    }
  }
}
