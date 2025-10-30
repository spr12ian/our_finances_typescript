// @lib/settingsCache.ts
import { FastLog } from "@logging";

const CACHE_TTL_SECONDS = 300; // 5 minutes default
const PREFIX = "SET_"; // helps avoid key clashes

/** Choose which properties store to use (default: script-wide) */
const props = PropertiesService.getScriptProperties();
const cache = CacheService.getScriptCache();

/**
 * Get a setting by key. First checks the cache, then falls back to properties.
 * Automatically re-caches on read for faster subsequent access.
 */
export function getSetting(key: string, fallback?: string): string | null {
  const fullKey = PREFIX + key;
  let value = cache.get(fullKey);
  if (value !== null) {
    FastLog.log?.(`Cache hit for ${fullKey}`);
    return value;
  }

  value = props.getProperty(fullKey);
  if (value !== null) {
    FastLog.log?.(`Cache miss → Properties hit for ${fullKey}`);
    cache.put(fullKey, value, CACHE_TTL_SECONDS);
    return value;
  }

  FastLog.warn?.(`Setting not found: ${fullKey}`);
  return fallback ?? null;
}

/**
 * Set (and immediately cache) a setting value.
 */
export function setSetting(key: string, value: string): void {
  const fullKey = PREFIX + key;
  props.setProperty(fullKey, value);
  cache.put(fullKey, value, CACHE_TTL_SECONDS);
  FastLog.log?.(`Set setting ${fullKey}=${value}`);
}

/**
 * Remove a key from both properties and cache.
 */
export function deleteSetting(key: string): void {
  const fullKey = PREFIX + key;
  props.deleteProperty(fullKey);
  cache.remove(fullKey);
  FastLog.log?.(`Deleted setting ${fullKey}`);
}

/**
 * Get all current settings (cached view is not used here).
 */
export function getAllSettings(): Record<string, string> {
  const all = props.getProperties();
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith(PREFIX)) filtered[k.slice(PREFIX.length)] = v;
  }
  return filtered;
}
