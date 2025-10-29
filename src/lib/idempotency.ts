// idempotency.ts
export function idempotencyKey(workflowName: string, stepName: string, sheet: string) {
  return `q:idem:${workflowName}:${stepName}:${sheet}`;
}

export function tryClaimKey(key: string, ttlSeconds: number): boolean {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(50)) return false;

  try {
    const cache = CacheService.getDocumentCache();
    if (!cache) return false;            // <- handle nullable type

    if (cache.get(key)) return false;
    cache.put(key, "1", ttlSeconds);
    return true;
  } finally {
    lock.releaseLock();
  }
}

