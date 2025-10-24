import { FastLog, functionStart } from "./logging";

export function lockWrapper<T>(label: string, fn: () => T, timeout: number): T {
  const finish = functionStart(label);
  try {
    const lock = LockService.getDocumentLock();
    if (lock.tryLock(timeout)) {
      FastLog.log(`${label}: Lock acquired`);
      try {
        return fn();
      } finally {
        lock.releaseLock();
      }
    } else {
      throw new Error(`${label}: Queue is busy; try again shortly.`);
    }
  } finally {
    finish();
  }
}
