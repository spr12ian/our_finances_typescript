import { ONE_SECOND_MS } from "@lib/timeConstants";
import { FastLog } from "./logging";

type LockStrategy = "skip" | "run-unlocked";

type ScriptLockOptions =
  | { timeoutMs: number; strategy?: LockStrategy; label?: string }
  | { timeoutMs?: number; strategy: LockStrategy; label?: string };

export function withScriptLock<T>(
  fn: () => T,
  {
    timeoutMs = 5 * ONE_SECOND_MS,
    strategy = "skip",
    label = fn.name,
  }: ScriptLockOptions
): T | undefined {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(timeoutMs)) {
    FastLog.warn(`${label}: script lock busy`);
    return strategy === "run-unlocked" ? fn() : undefined;
    if (strategy === "skip") {
      FastLog.warn(`[${label}] skipped: could not acquire lock`);
      return undefined;
    }
    if (strategy === "run-unlocked") {
      FastLog.warn(`[${label}] running without lock`);
      return fn();
    }
  }

  FastLog.log(`${label}: script lock acquired`);
  try {
    return fn();
  } finally {
    try {
      lock.releaseLock();
      FastLog.log(`${label}: script lock released`);
    } catch (e) {
      FastLog.error(`${label}: error releasing script lock`, e);
    }
  }
}
