// logging/WithLog.ts

import { getErrorMessage } from "../errors";
import { FastLog, functionStart, methodStart } from "./FastLog";

/**
 * Decorator to automatically call methodStart/finish for logging.
 *
 * Usage:
 *   @WithLog("fixSheet")
 *   fixSheet() { return this.sheet.fixSheet(); }
 *
 *   // or
 *   @WithLog()
 *   fixSheet() { return this.sheet.fixSheet(); } // label defaults to method name
 */
export function WithLog(label?: string) {
  return function (
    _target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value as (...args: any[]) => any;

    descriptor.value = function (...args: any[]) {
      // Prefer explicit label, then method name
      const name = label ?? String(propertyKey);

      // Prefer instance.sheetName if available, else fallback to constructor.name
      const context =
        (this as any)?.sheetName ??
        (this as any)?.constructor?.name ??
        "Unknown";

      const finish = methodStart(name, context);

      try {
        const result = original.apply(this, args);

        // Handle Promise or synchronous result
        if (result && typeof (result as any).then === "function") {
          return (result as Promise<any>).then(
            (val) => {
              finish();
              return val;
            },
            (err) => {
              finish();
              throw err;
            }
          );
        }

        finish();
        return result;
      } catch (err) {
        finish();
        throw err;
      }
    };

    return descriptor;
  };
}

/**
 * Function wrapper version
 */
export function withLog<T>(
  label: string,
  fn: (...args: any[]) => T
): (...args: any[]) => T {
  Logger.log("withLog called");
  return function (...args: any[]): T {
    Logger.log(`label: ${label}`);
    const finish = functionStart(label);
    try {
      return fn(...args);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      FastLog.error(`Error in ${label}: ${errorMessage}`);
      throw new Error(errorMessage);
    } finally {
      finish();
    }
  };
}
