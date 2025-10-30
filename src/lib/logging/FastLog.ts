import { safeWrite } from "@lib/safeWrite";

// ────────────────────────────────────────────────────────────
// Fast, low-noise logging for GAS (no namespaces; isolatedModules-safe)
// ────────────────────────────────────────────────────────────

type LogLevel =
  | "none"
  | "error"
  | "info"
  | "warn"
  | "start"
  | "finish"
  | "log"
  | "logTime";
const LOG_LEVEL: LogLevel = "log"; // set to "none" in production
type LogRecord = { t: string; level: LogLevel; msg: string };

const levels: Record<LogLevel, number> = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  start: 4,
  finish: 4,
  log: 5,
  logTime: 5,
} as const;

const RING_SIZE = 20;
const PROP_KEY = "FASTLOG_RING";
const PROP_MAX_BYTES = 8000; // Less than GAS limit per property value
const SNAPSHOT_COOLDOWN_SEC = 60;
const SNAPSHOT_KEY_LAST = "FASTLOG_LAST_SNAPSHOT_ISO";
const STATUS_SHEET_NAME = "$Status";
const ERROR_SNAPSHOT_THRESHOLD = 3;

// in-execution state
let memRing: LogRecord[] | null = null;
let errorCount = 0;
let statusSheetCache: GoogleAppsScript.Spreadsheet.Sheet | null = null;

// ────────────────────────────────────────────────────────────
// Public API (exported for TS/module use; also mirrored to globalThis)
// ────────────────────────────────────────────────────────────
export const FastLog = {
  // type LogLevel = "none" | "error" | "info" | "warn" | "log";
  finish: (label: unknown, startTime: Date, ...rest: unknown[]): void => {
    const ms = Date.now() - (startTime?.getTime?.() ?? Date.now());
    // Append ", <duration>" to the end of the message
    log("finish", `${safeString(label)}, ${formatDurationMs(ms)}`, ...rest);
  },
  log: (...p: unknown[]) => log("log", ...p),
  logTime: (...p: unknown[]) => log("logTime", ...p),
  warn: (...p: unknown[]) => log("warn", ...p),
  info: (...p: unknown[]) => log("info", ...p),
  error: (...p: unknown[]) => log("error", ...p),
  start: (...p: unknown[]): Date => {
    const now = new Date();
    log("start", ...p);
    return now;
  },
  persistRing,
  manualSnapshot,
  clear: clearRing,
};

export function functionStart(functionName: string) {
  const msg = `function ${functionName}`;
  const start = FastLog.start(msg);
  return () => FastLog.finish(msg, start);
}

export function methodStart(methodName: string, contextName: string) {
  const msg = `${contextName}.${methodName}`;
  const start = FastLog.start(msg);
  return () => FastLog.finish(msg, start);
}

export function propertyStart(propertyName: string, contextName: string) {
  const msg = `get ${contextName}.${propertyName}`;
  const start = FastLog.start(msg);
  return () => FastLog.finish(msg, start);
}

// ——— internals ———

function byteLength(s: string): number {
  // UTF-8 byte length
  return Utilities.newBlob(s).getBytes().length;
}

function clearRing() {
  memRing = [];
  persistRing();
}

function formatDurationMs(ms: number): string {
  // e.g. "845 ms", "2.13 s"
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

function getRing(): LogRecord[] {
  if (memRing) return memRing;
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(PROP_KEY);
    memRing = raw ? (JSON.parse(raw) as LogRecord[]) : [];
  } catch {
    memRing = [];
  }
  return memRing!;
}

function getStatusSheet(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  // Return cached if it's for the same spreadsheet and still exists
  if (
    statusSheetCache &&
    statusSheetCache.getParent()?.getId() === ss.getId()
  ) {
    try {
      // touch a harmless getter to force GAS to validate the handle
      statusSheetCache.getSheetId();
      return statusSheetCache;
    } catch {
      statusSheetCache = null; // stale; fall through to re-fetch
    }
  }

  let sh = ss.getSheetByName(STATUS_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(STATUS_SHEET_NAME);
  statusSheetCache = sh;
  return sh;
}

function log(level: LogLevel, ...parts: unknown[]) {
  if (levels[level] > levels[LOG_LEVEL]) return; // skip if below log level

  const msg = parts.map((p) => safeString(p)).join(" ");
  const nowIso = new Date().toISOString();

  // Fast console logs → view in Executions
  switch (level) {
    case "log":
      console.log(msg);
      break;
    case "logTime":
      const now = new Date();
      const iso = now.toISOString();
      console.log(`${iso}: ${msg}`);
      break;
    case "start":
      console.log(`START: ${msg}`);
      break;
    case "finish":
      console.log(`FINISH: ${msg}`);
      break;
    case "warn":
      console.warn(msg);
      break;
    case "info":
      console.info(msg);
      break;
    default:
      console.error(msg);
  }

  const ring = getRing();
  ring.push({ t: nowIso, level, msg });
  if (ring.length > RING_SIZE) ring.shift();

  if (level === "error") {
    errorCount++;
    if (errorCount >= ERROR_SNAPSHOT_THRESHOLD) {
      try {
        safeSnapshotToSheet(ring);
        errorCount = 0;
      } catch (e) {
        console.error("Snapshot failed:", safeString(e));
      }
    }
  }
}

function manualSnapshot() {
  safeSnapshotToSheet(getRing());
}

function persistRing() {
  try {
    // @ts-ignore LockService exists in GAS
    const lock =
      typeof LockService !== "undefined" ? LockService.getScriptLock() : null;
    if (lock && !lock.tryLock(200)) return; // skip silently if busy

    try {
      // Merge current store to avoid overwriting newer entries
      const sp = PropertiesService.getScriptProperties();
      const raw = sp.getProperty(PROP_KEY);
      const current: LogRecord[] = raw ? JSON.parse(raw) : [];

      // Merge unique by (t,level,msg); keep order and cap size
      const merged = [...current, ...getRing()];
      const seen = new Set<string>();
      const dedup: LogRecord[] = [];
      for (const r of merged) {
        const k = `${r.t}|${r.level}|${r.msg}`;
        if (!seen.has(k)) {
          seen.add(k);
          dedup.push(r);
        }
      }
      // Trim to RING_SIZE
      while (dedup.length > RING_SIZE) dedup.shift();

      // Size guard
      let payload = JSON.stringify(dedup);
      if (byteLength(payload) > PROP_MAX_BYTES) {
        // drop oldest until it fits
        while (
          dedup.length &&
          byteLength(JSON.stringify(dedup)) > PROP_MAX_BYTES
        ) {
          dedup.shift();
        }
        payload = JSON.stringify(dedup);
      }

      sp.setProperty(PROP_KEY, payload);
      memRing = dedup; // keep in-memory in sync
    } finally {
      lock?.releaseLock();
    }
  } catch (e) {
    console.warn("persistRing failed:", safeString(e));
  }
}

function safeSnapshotToSheet(ring: LogRecord[]) {
  try {
    const sp = PropertiesService.getScriptProperties();
    const last = sp.getProperty(SNAPSHOT_KEY_LAST);
    const now = new Date();
    if (last) {
      const dt = (now.getTime() - new Date(last).getTime()) / 1000;
      if (dt < SNAPSHOT_COOLDOWN_SEC) return; // throttle
    }
    safeWrite(() => snapshotToSheet(ring));
    sp.setProperty(SNAPSHOT_KEY_LAST, now.toISOString());
  } catch (e) {
    console.error("Snapshot failed:", safeString(e));
  }
}

function safeString(v: unknown): string {
  try {
    if (v instanceof Error) return `${v.name}: ${v.message}\n${v.stack ?? ""}`;
    if (typeof v === "string") return v;
    if ((v as any)?.getA1Notation)
      return `Range(${(v as any).getA1Notation()})`;
    if ((v as any)?.getName) return `Sheet(${(v as any).getName()})`;

    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function snapshotToSheet(ring: LogRecord[]) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = getStatusSheet(ss);
  const header = [["Timestamp (ISO)", "Level", "Message"]];
  const rows = ring.map((r) => [r.t, r.level.toUpperCase(), r.msg]);
  const data = header.concat(rows);

  sh.clearContents();
  sh.getRange(1, 1, data.length, data[0].length).setValues(data);
  sh.getRange(1, 1, 1, data[0].length).setFontWeight("bold");
}

// Optional: make available at runtime even if bundler wraps in IIFE
(globalThis as any).FastLog = FastLog;
