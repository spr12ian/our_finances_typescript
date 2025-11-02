// @lib/withUserDebounceSameSheet.ts
import { withGuardedLock, type GuardedLockOptions } from "@lib/withGuardedLock";
import { TWO_SECONDS } from "./timeConstants";

export function withUserDebounceSameSheet<T>(
  sheetName: string,
  opts: Omit<GuardedLockOptions, "userDebounceMs" | "userDebounceKey"> & { userDebounceMs?: number },
  fn: () => T
): T | undefined {
  const keyStr = typeof opts.key === "function" ? opts.key() : opts.key;
  return withGuardedLock(
    {
      ...opts,
      userDebounceMs: opts.userDebounceMs ?? TWO_SECONDS,
      userDebounceKey: `${keyStr}:sheet:${sheetName}`,
      userDebounceMode: "per-key",
    },
    fn
  );
}
