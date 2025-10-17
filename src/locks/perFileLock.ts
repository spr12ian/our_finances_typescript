// src/locks/perFileLock.ts

/** Best-effort distributed mutex keyed by spreadsheet/file id. */
export function withPerFileLock<T>(
  fileId: string,
  label: string,
  fn: () => T,
  timeoutMs = 15_000,           // how long we're willing to wait
  leaseSeconds = 30,            // how long we hold the lease
): T {
  const cache = getCacheWithAdd();
  const token = Utilities.getUuid();
  const key = `mutex:file:${fileId}`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // Cache.add is atomic: succeeds only if the key is absent
    if (cache.add(key, token, leaseSeconds)) {
      try {
        return fn();
      } finally {
        // Only remove if we still own it
        if (cache.get(key) === token) cache.remove(key);
      }
    }
    // brief jittered sleep to avoid thundering herd
    Utilities.sleep(200 + Math.floor(Math.random() * 250));
  }
  throw new Error(`[${label}] could not acquire per-file lock for ${fileId} within ${timeoutMs}ms`);
}

function getCacheWithAdd(): GoogleAppsScript.Cache.Cache & {
  add: (key: string, value: string, expirationInSeconds: number) => boolean;
} {
  return CacheService.getScriptCache() as any;
}
