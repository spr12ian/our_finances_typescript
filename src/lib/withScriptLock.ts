// withScriptLock.ts

import { FIVE_SECONDS } from "@lib/timeConstants";

export function withScriptLock<T>(fn: () => T): T {
  // If you run this outside GAS, stub LockService.
  // @ts-ignore
  const lock =
    typeof LockService !== "undefined"
      ? // @ts-ignore
        LockService.getScriptLock()
      : null;

  if (lock) {
    lock.tryLock(FIVE_SECONDS); // best-effort
    try {
      return fn();
    } finally {
      lock.releaseLock();
    }
  } else {
    return fn();
  }
}
