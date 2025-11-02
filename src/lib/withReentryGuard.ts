// @lib/withReentryGuard.ts
// Local Map (ms precision) + CacheService claim (sec precision)
// with a short ScriptLock to avoid cross-instance races.

import type { CacheScope } from "@lib/tempCache";
import { cacheRemove, tryClaimKey } from "@lib/tempCache";
import { FastLog } from "@logging";

// === Local in-memory guard for same-container, sub-second accuracy ===
const __localUntil = new Map<string, number>();

export interface ReentryOptions {
  scope?: CacheScope; // default: script
  lockMs?: number; // default: 200ms
  releaseOnFinish?: boolean; // default: false (keep full TTL lockout)
}

/**
 * withReentryGuard: skip re-entrant execution within TTL window.
 * - Fast same-instance suppression via local Map (ms precision).
 * - Cross-instance atomic-ish claim via CacheService + short ScriptLock (sec precision).
 * - If blocked, returns undefined and does NOT invoke fn.
 * - If allowed, invokes fn and returns its result.
 */
export function withReentryGuard<T>(
  key: string,
  ttlMs: number,
  fn: () => T,
  opts?: ReentryOptions
): T | undefined {
  const now = Date.now();
  const scope = opts?.scope ?? "script";
  const lockMs = opts?.lockMs ?? 200;
  const releaseOnFinish = opts?.releaseOnFinish ?? false;

  // 1) Same-container guard (sub-second precision)
  const until = __localUntil.get(key) ?? 0;
  if (until > now) {
    FastLog?.log?.(`reentry(local): ${key} blocked`);
    return undefined;
  }
  __localUntil.set(key, now + ttlMs);

  // Opportunistic cleanup so Map doesn’t grow unbounded
  if (__localUntil.size > 200) {
    const t = Date.now();
    for (const [k, u] of __localUntil) if (u <= t) __localUntil.delete(k);
  }

  // 2) Cross-instance atomic claim
  const claimed = tryClaimKey(key, Math.ceil(ttlMs / 1000), scope, lockMs);
  if (!claimed) {
    FastLog?.log?.(`reentry(cache): ${key} blocked`);
    return undefined;
  }

  try {
    return fn();
  } finally {
    if (releaseOnFinish) {
      // Early release converts the behavior to "no overlapping runs" rather than fixed cool-down.
      cacheRemove(key, scope);
    }
  }
}
