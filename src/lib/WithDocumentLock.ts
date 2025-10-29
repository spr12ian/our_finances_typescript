// WithDocumentLock

import { getErrorMessage } from "./errors";
import { FastLog, functionStart } from "./logging";

/**
 * Method decorator version
 */
export function WithDocumentLock(label: string, timeout: number = 3000) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const finish = functionStart(label);
      const lock = safeGetDocumentLock();

      if (lock && lock.tryLock(timeout)) {
        FastLog.log(`${label}: Lock acquired (Document)`);
        try {
          return originalMethod.apply(this, args);
        } finally {
          lock.releaseLock();
          FastLog.log(`${label}: Lock released (Document)`);
          finish();
        }
      } else {
        FastLog.warn(`${label}: Document lock busy — skipping execution.`);
        finish();
        return undefined; // ✅ No exception, just skip
      }
    };

    return descriptor;
  };
}

/**
 * Function wrapper version
 */
export function withDocumentLock<T>(
  label: string,
  fn: (...args: any[]) => T,
  timeout = 3000
): (...args: any[]) => T | undefined {
  return function (...args: any[]): T | undefined {
    const finish = functionStart(label);
    const lock = safeGetDocumentLock();

    if (lock && lock.tryLock(timeout)) {
      FastLog.log(`${label}: Lock acquired (Document)`);
      try {
        return fn(...args);
      } finally {
        lock.releaseLock();
        FastLog.log(`${label}: Lock released (Document)`);
        finish();
      }
    } else {
      FastLog.warn(`${label}: Document lock busy — skipping execution.`);
      finish();
      return undefined; // ✅ Return undefined instead of throwing
    }
  };
}

function safeGetDocumentLock() {
  try {
    return LockService.getDocumentLock();
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.warn(`Not in a document context: ${errorMessage}`);
    return null;
  }
}
