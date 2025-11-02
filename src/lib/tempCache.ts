// @lib/tempCache.ts
// Fast, volatile helpers around CacheService for short-lived state.

import { FastLog } from "@logging";

export type CacheScope = "script" | "user" | "document";

const MAX_TTL_SEC = 6 * 60 * 60; // CacheService upper bound (~6h)
const MIN_TTL_SEC = 1; // CacheService min TTL granularity

// Basic get/put/remove (string values)
export function cacheGet(
  key: string,
  scope: CacheScope = "script"
): string | null {
  return getCache(scope).get(key);
}

export function cacheGetJSON<T = unknown>(
  key: string,
  scope: CacheScope = "script"
): T | null {
  const s = cacheGet(key, scope);
  if (s == null) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    FastLog?.warn?.(`tempCache: JSON parse failed for key=${key}`);
    return null;
  }
}

export function cachePut(
  key: string,
  value: string,
  ttlSeconds?: number,
  scope: CacheScope = "script"
): void {
  getCache(scope).put(key, value, clampTtlSec(ttlSeconds));
}

export function cachePutJSON(
  key: string,
  value: unknown,
  ttlSeconds?: number,
  scope: CacheScope = "script"
): void {
  try {
    cachePut(key, JSON.stringify(value), ttlSeconds, scope);
  } catch (e) {
    FastLog?.warn?.(`tempCache: JSON stringify failed for key=${key}: ${e}`);
  }
}

export function cacheRemove(key: string, scope: CacheScope = "script"): void {
  getCache(scope).remove(key);
}

/**
 * rateLimit: allow up to `maxCalls` within `windowSeconds`.
 * Returns true if allowed; false if rate-limited.
 */
export function rateLimit(
  key: string,
  maxCalls: number,
  windowSeconds: number,
  scope: CacheScope = "script",
  lockMs = 200
): boolean {
  const ttl = clampTtlSec(windowSeconds);
  const cache = getCache(scope);
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(lockMs)) {
    // Best-effort fallback: deny if counter appears high
    const fallback = Number(cache.get(key) ?? "0");
    return fallback < maxCalls;
  }

  try {
    const current = Number(cache.get(key) ?? "0");
    if (Number.isNaN(current)) {
      cache.put(key, "1", ttl);
      return true;
    }
    if (current >= maxCalls) return false;

    // First increment sets the window TTL.
    if (current === 0) {
      cache.put(key, "1", ttl);
    } else {
      // Overwrite keeps a fresh TTL; acceptable drift.
      cache.put(key, String(current + 1), ttl);
    }
    return true;
  } finally {
    lock.releaseLock();
  }
}

/**
 * remember: memoize a computed value for a short time.
 * - Producer is called only on cache miss.
 * - Value is JSON-serialized.
 */
export function remember<T>(
  key: string,
  ttlSeconds: number,
  producer: () => T,
  scope: CacheScope = "script"
): T {
  const hit = cacheGet(key, scope);
  if (hit != null) {
    FastLog?.log?.(`tempCache: hit ${key}`);
    try {
      return JSON.parse(hit) as T;
    } catch {
      // fall through to recompute
    }
  }

  const value = producer();
  cachePutJSON(key, value, ttlSeconds, scope);
  FastLog?.log?.(`tempCache: miss→set ${key}`);
  return value;
}

/**
 * tryClaimKey: atomic-ish "claim once" for duration of TTL.
 * Uses a short ScriptLock to serialize check+set across instances.
 */
export function tryClaimKey(
  key: string,
  ttlSeconds: number,
  scope: CacheScope = "script",
  lockMs = 200
): boolean {
  const cache = getCache(scope);
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(lockMs)) {
    // Non-blocking fallback: if key is present, deny; else claim.
    if (cache.get(key) != null) return false;
    cache.put(key, "1", clampTtlSec(ttlSeconds));
    return true;
  }

  try {
    if (cache.get(key) != null) return false;
    cache.put(key, "1", clampTtlSec(ttlSeconds));
    return true;
  } finally {
    lock.releaseLock();
  }
}

// === Helpers ===

function clampTtlSec(ttlSec?: number): number {
  if (!ttlSec || ttlSec <= 0 || !Number.isFinite(ttlSec)) return MIN_TTL_SEC;
  return Math.min(Math.max(MIN_TTL_SEC, Math.floor(ttlSec)), MAX_TTL_SEC);
}

function getCache(scope: CacheScope = "script"): GoogleAppsScript.Cache.Cache {
  switch (scope) {
    case "user":
      return CacheService.getUserCache();
    case "document":
      const cache = CacheService.getDocumentCache();
      if (!cache) throw new Error("Document cache unavailable");
      return cache;
    default:
      return CacheService.getScriptCache();
  }
}
