// queueIntake.ts

const INTAKE_INDEX_PROP = "INTAKE_INDEX_V1";      // JSON array of keys
const INTAKE_PREFIX = "q:intake:";                // Cache key prefix
const INTAKE_TTL_SEC = 600;                       // 10 minutes
const INTAKE_MAX_KEYS = 500;                      // bound the index size

// Queue sheet target
const QUEUE_SHEET_NAME = "$Queue";                 // your existing queue sheet

function intakeNowIso(): string {
  return new Date().toISOString();
}

function sp() {
  return PropertiesService.getScriptProperties();
}

function sc() {
  return CacheService.getScriptCache();
}

function withScriptLock<T>(ms: number, fn: () => T): T | undefined {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(ms)) return;
  try {
    return fn();
  } finally {
    try { lock.releaseLock(); } catch {}
  }
}
