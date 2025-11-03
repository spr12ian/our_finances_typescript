import { ONE_SECOND_MS } from "@lib/timeConstants";
import { FastLog } from "./logging";

/**
 * Executes a function with a global script lock (LockService.getScriptLock()).
 * If LockService is unavailable (non-GAS environment), runs without locking.
 */
export function withScriptLock<T>(fn: () => T): T {
  // @ts-ignore: LockService exists only in GAS
  const lockService = typeof LockService !== "undefined" ? LockService : null;

  if (!lockService) {
    FastLog.warn("LockService unavailable — running without lock");
    return fn();
  }

  try {
    // @ts-ignore
    const lock = lockService.getScriptLock();
    if (lock.tryLock(5 * ONE_SECOND_MS)) {
      FastLog.log("Script lock acquired");
      try {
        return fn();
      } finally {
        lock.releaseLock();
        FastLog.log("Script lock released");
      }
    } else {
      FastLog.warn("Script lock busy — skipping execution");
      return undefined as unknown as T; // explicit skip
    }
  } catch (err) {
    FastLog.error("Error acquiring script lock", err);
    // fallback to direct execution
    return fn();
  }
}
