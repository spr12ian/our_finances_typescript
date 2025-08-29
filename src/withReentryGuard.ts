// Fast local memory + cross-instance cache.
// Do NOT delete the key; let TTL expire.
const __localReentry = new Map();

export function withReentryGuard(key:string, ttlMs:number, fn:() => void) {
  const now = Date.now();

  // 1) Super-fast same-container guard
  const localUntil = __localReentry.get(key) || 0;
  if (localUntil > now) return;
  __localReentry.set(key, now + ttlMs);

  // 2) Cross-instance guard (cheap)
  const cache = CacheService.getScriptCache();
  const cachedUntil = Number(cache.get(key) || 0);
  if (cachedUntil && cachedUntil > now) return;

  // CacheService TTL is in seconds, min 1s.
  cache.put(key, String(now + ttlMs), Math.max(1, Math.ceil(ttlMs / 1000)));

  try {
    fn();
  } finally {
    // Do not delete; TTL enforces the cool-down.
    // Opportunistic cleanup so the Map doesn’t grow between calls:
    if (__localReentry.size > 200) {
      const t = Date.now();
      for (const [k, u] of __localReentry) if (u <= t) __localReentry.delete(k);
    }
  }
}
