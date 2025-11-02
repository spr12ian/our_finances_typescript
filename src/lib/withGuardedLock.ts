// @lib/withGuardedLock.ts
// TTL is the lifetime (duration) of a stored item — after that time, it’s deleted automatically.
import { withDocumentLock } from "@lib/WithDocumentLock";
import { ONE_SECOND } from "@lib/timeConstants";
import { withReentryGuard } from "@lib/withReentryGuard";
import { FastLog } from "./logging";

type ReentryScope = "script" | "document" | "user";

export interface GuardedLockOptions {
  key: string | (() => string);

  // per-key cooldown (e.g., per-sheet)
  cooldownMs?: number;
  cooldownKey?: string | (() => string);
  cooldownScope?: ReentryScope; // default: "document"
  cooldownBufferSec?: number; // default: 5
  cooldownOnError?: boolean; // default: false

  // optional idempotency (skip if token already claimed recently)
  idemToken?: string | (() => string);
  idemTtlSec?: number; // default: 30
  idemScope?: ReentryScope; // default: "document"
  idemLockTimeoutMs?: number; // default: 50 (ScriptLock tryLock)

  // document lock
  disableLock?: boolean;
  lockLabel?: string;
  lockTimeoutMs?: number;

  // reentry
  reentryTtlMs?: number;
  disableReentry?: boolean;
  reentryOptions?: {
    releaseOnFinish?: boolean;
    scope?: ReentryScope;
    lockMs?: number;
  };

  // per-user debounce (default: off)
  userDebounceMs?: number; // e.g., 1500
  userDebounceKey?: string | (() => string); // default: key
  userDebounceMode?: "per-key" | "any"; // default: "per-key"
}

function getCache(scope: ReentryScope): GoogleAppsScript.Cache.Cache | null {
  try {
    switch (scope) {
      case "user":
        return CacheService.getUserCache();
      case "document":
        return CacheService.getDocumentCache();
      default:
        return CacheService.getScriptCache();
    }
  } catch {
    return null;
  }
}

/** Compose: (optional) userDebounce → cooldown → reentry → documentLock → fn */
export function withGuardedLock<T>(
  opts: GuardedLockOptions,
  fn: () => T
): T | undefined {
  const {
    // cooldown
    cooldownMs,
    cooldownKey,
    cooldownScope = "document",
    cooldownBufferSec = 5,
    cooldownOnError = false,

    // idempotency
    idemToken,
    idemTtlSec = 30,
    idemScope = "document",
    idemLockTimeoutMs = 50,

    //lock
    disableLock = false,
    lockLabel: givenLockLabel,
    lockTimeoutMs = 300,

    // reentry
    reentryTtlMs = ONE_SECOND,
    reentryOptions,
    disableReentry = false,

    //user debounce
    userDebounceMs,
    userDebounceKey,
    userDebounceMode = "per-key",
  } = opts;

  const key = typeof opts.key === "function" ? opts.key() : opts.key;
  const finalLockLabel = givenLockLabel ?? key ?? "withGuardedLock";

  // Order: userDebounce →
  // idempotency claim →
  // cooldown (pre-check/reserve) →
  // reentry →
  // doc lock →
  // fn

  // --- 0) Per-user debounce (opt-in) ---
  if (userDebounceMs && userDebounceMs > 0) {
    const uKey =
      typeof userDebounceKey === "function"
        ? userDebounceKey()
        : userDebounceKey ?? key;
    const uCache = getCache("user");
    if (uCache) {
      const now = Date.now();
      if (userDebounceMode === "any") {
        const uAnyUntil = Number(uCache.get("__wg_user_any_until") || 0);
        if (uAnyUntil && now < uAnyUntil) {
          FastLog?.log?.(
            `withGuardedLock user debounce (any) until=${uAnyUntil}`
          );
          return undefined;
        }
        uCache.put(
          "__wg_user_any_until",
          String(now + userDebounceMs),
          Math.ceil(userDebounceMs / 1000) + 2
        );
      } else {
        const uPerKeyUntil = Number(
          uCache.get(`__wg_user_key_until:${uKey}`) || 0
        );
        if (uPerKeyUntil && now < uPerKeyUntil) {
          FastLog?.log?.(
            `withGuardedLock user debounce (key) ${uKey} until=${uPerKeyUntil}`
          );
          return undefined;
        }
        uCache.put(
          `__wg_user_key_until:${uKey}`,
          String(now + userDebounceMs),
          Math.ceil(userDebounceMs / 1000) + 2
        );
      }
    }
  }

  // --- 1) Idempotency (optional) ---
  if (idemToken) {
    const token = typeof idemToken === "function" ? idemToken() : idemToken;
    const cache = getCache(idemScope);
    if (cache) {
      // Acquire a short ScriptLock to make claim atomic
      const sLock = LockService.getScriptLock();
      if (!sLock.tryLock(idemLockTimeoutMs)) {
        FastLog?.log?.(`withGuardedLock idempotency: could not get script lock for ${token}`);
        return undefined; // soft-skip
      }
      try {
        if (cache.get(token)) {
          FastLog?.log?.(`withGuardedLock idempotency: already claimed ${token}`);
          return undefined; // already claimed within ttl
        }
        cache.put(token, "1", Math.max(1, idemTtlSec));
      } finally {
        sLock.releaseLock();
      }
    }
  }

  // --- 2) Optional long(er) cooldown (e.g., per-sheet throttle) ---
  const ckey =
    typeof cooldownKey === "function" ? cooldownKey() : cooldownKey ?? key;
  const cache = cooldownMs ? getCache(cooldownScope) : null;
  const now = Date.now();

  if (cache && cooldownMs) {
    const untilTs = Number(cache.get(ckey) || 0);
    if (untilTs && now < untilTs) {
      FastLog?.log?.(`withGuardedLock cooldown ${ckey} until=${untilTs}`);
      return undefined;
    }

    if (!cooldownOnError) {
      const expiry = now + cooldownMs;
      cache.put(
        ckey,
        String(expiry),
        Math.ceil(cooldownMs / 1000) + (cooldownBufferSec ?? 5)
      );
    }
  }

  // --- 3) Run wrapped function (with document lock) ---
  const runWithLock = (): T | undefined => {
    if (disableLock) return fn();
    const res: any = withDocumentLock(finalLockLabel, fn, lockTimeoutMs);
    if (typeof res === "function") return (res as () => T)();
    return res as T;
  };

  // --- 4) Reentry guard (short debounce), then run ---
  const run = (): T | undefined => {
    try {
      const result = disableReentry
        ? runWithLock()
        : (withReentryGuard(
            key,
            reentryTtlMs,
            () => runWithLock(),
            reentryOptions
          ) as T);

      if (cooldownOnError && cache && cooldownMs) {
        const expiry = Date.now() + cooldownMs;
        cache.put(
          ckey,
          String(expiry),
          Math.ceil(cooldownMs / 1000) + (cooldownBufferSec ?? 5)
        );
      }
      return result;
    } catch (err) {
      FastLog?.warn?.(`withGuardedLock(${key}) error: ${err}`);
      throw err;
    }
  };

  return run();
}
