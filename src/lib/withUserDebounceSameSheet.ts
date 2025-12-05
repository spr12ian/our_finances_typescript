// @lib/withUserDebounceSameSheet.ts
import { withGuardedLock, type GuardedLockOptions } from "@lib/withGuardedLock";
import { ONE_SECOND_MS } from "./timeConstants";

export function withUserDebounceSameSheet<T>(
  sheetName: string,
  opts: Omit<GuardedLockOptions, "userDebounceMs" | "userDebounceKey"> & {
    userDebounceMs?: number;
  },
  fn: () => T
): T | undefined {
  const keyStr = typeof opts.key === "function" ? opts.key() : opts.key;
  return withGuardedLock(
    {
      ...opts,
      userDebounceMs: opts.userDebounceMs ?? 2 * ONE_SECOND_MS,
      userDebounceKey: `${keyStr}:sheet:${sheetName}`,
      userDebounceMode: "per-key",
      // sensible defaults for UI-ish entrypoints:
      disableLock: opts.disableLock ?? true,
      disableReentry: opts.disableReentry ?? true,
    },
    fn
  );
}
