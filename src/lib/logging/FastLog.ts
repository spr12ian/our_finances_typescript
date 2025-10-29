/// <reference types="google-apps-script" />

// ────────────────────────────────────────────────────────────
// Fast, low-noise logging for GAS (no namespaces; isolatedModules-safe)
// ────────────────────────────────────────────────────────────

type LogLevel = "none" | "error" | "info" | "warn" | "start" | "finish" | "log";
const LOG_LEVEL: LogLevel = "log"; // set to "none" in production
type LogRecord = { t: string; level: LogLevel; msg: string };

const levels: Record<LogLevel, number> = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  start: 4,
  finish: 5,
  log: 6,
};

const RING_SIZE = 20;
const PROP_KEY = "FASTLOG_RING";
const STATUS_SHEET_NAME = "$Status";
const ERROR_SNAPSHOT_THRESHOLD = 3;

// in-execution state
let memRing: LogRecord[] | null = null;
let errorCount = 0;
let statusSheetCache: GoogleAppsScript.Spreadsheet.Sheet | null = null;

export function functionStart(functionName: string) {
  Logger.log(`functionStart called: ${functionName}`);
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

// ────────────────────────────────────────────────────────────
// Public API (exported for TS/module use; also mirrored to globalThis)
// ────────────────────────────────────────────────────────────
export const FastLog = {
  // type LogLevel = "none" | "error" | "info" | "warn" | "log";
  log: (...p: unknown[]) => log("log", ...p),
  warn: (...p: unknown[]) => log("warn", ...p),
  info: (...p: unknown[]) => log("info", ...p),
  error: (...p: unknown[]) => log("error", ...p),
  start: (...p: unknown[]): Date => {
    const now = new Date();
    log("start", ...p);
    return now;
  },
  finish: (label: unknown, startTime: Date, ...rest: unknown[]): void => {
    const ms = Date.now() - (startTime?.getTime?.() ?? Date.now());
    // Append ", <duration>" to the end of the message
    log("finish", `${safeString(label)}, ${formatDurationMs(ms)}`, ...rest);
  },
  persistRing,
  manualSnapshot,
  clear: clearRing,
};

// ——— internals ———
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

function safeString(v: unknown): string {
  try {
    if (v instanceof Error) return `${v.name}: ${v.message}\n${v.stack ?? ""}`;
    if (typeof v === "string") return v;
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function getStatusSheet(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  if (
    statusSheetCache &&
    statusSheetCache.getParent()?.getId() === ss.getId()
  ) {
    return statusSheetCache;
  }
  let sh = ss.getSheetByName(STATUS_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(STATUS_SHEET_NAME);
  statusSheetCache = sh;
  return sh;
}

function snapshotToSheet(ring: LogRecord[]) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = getStatusSheet(ss);
  const header = [["Timestamp (ISO)", "Level", "Message"]];
  const rows = ring.map((r) => [r.t, r.level.toUpperCase(), r.msg]);
  const data = header.concat(rows);

  sh.clearContents();
  sh.getRange(1, 1, data.length, data[0].length).setValues(data);
  sh.autoResizeColumns(1, data[0].length);
  sh.getRange(1, 1, 1, data[0].length).setFontWeight("bold");
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
        snapshotToSheet(ring);
        errorCount = 0;
      } catch (e) {
        console.error("Snapshot failed:", safeString(e));
      }
    }
  }
}

function persistRing() {
  try {
    PropertiesService.getScriptProperties().setProperty(
      PROP_KEY,
      JSON.stringify(getRing())
    );
  } catch (e) {
    console.warn("persistRing failed:", safeString(e));
  }
}

function manualSnapshot() {
  snapshotToSheet(getRing());
}

function clearRing() {
  memRing = [];
  persistRing();
}

// Helper
// Add helper near internals

function formatDurationMs(ms: number): string {
  // e.g. "845 ms", "2.13 s"
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

// Optional: make available at runtime even if bundler wraps in IIFE
(globalThis as any).FastLog = FastLog;
