/// <reference types="google-apps-script" />
/**
 * Google Apps Script: Sheet‑backed job queue with a minute worker.
 * - Typed, modern TS (const/let, interfaces, column map, helpers)
 * - Exponential backoff with jitter, max attempts
 * - Dead‑letter sheet support
 * - Idempotent worker trigger creation
 * - Safe global exports for triggers (works with IIFE bundlers)
 */

// ───────────────────────────────────────────────────────────────────────────────
// Constants & schema
// ───────────────────────────────────────────────────────────────────────────────
import * as timeConstants from "./timeConstants";

const QUEUE_SHEET_NAME = "$Queue";            // hidden operational sheet
const DEAD_SHEET_NAME = "$QueueDead";         // optional dead‑letter sink

const MAX_ATTEMPTS = 5;                        // total tries per job
const DEFAULT_PRIORITY = 100;                  // lower number = higher priority
const DEFAULT_BACKOFF_MS = timeConstants.THIRTY_SECONDS;          // 30s base
const MAX_BACKOFF_MS = timeConstants.THIRTY_MINUTES;         // 30m max backoff
const MAX_BATCH = 6;                           // jobs per worker run
const WORKER_BUDGET_MS = 55 * timeConstants.ONE_SECOND;           // ms per worker run
const PRUNE_AFTER_DAYS = 7;                    // prune DONE/ERROR older than N days

const STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  DONE: "DONE",
  ERROR: "ERROR",
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];

// Column map to avoid magic numbers
const Col = {
  ID: 1,
  ENQUEUED_AT: 2,
  TYPE: 3,
  PRIORITY: 4,
  NEXT_RUN_AT: 5,
  ATTEMPTS: 6,
  STATUS: 7,
  PAYLOAD_JSON: 8,
  LAST_ERROR: 9,
  WORKER_ID: 10,
  STARTED_AT: 11,
} as const;

const HEADERS: string[] = [
  "id",
  "enqueued_at",
  "type",
  "priority",
  "next_run_at",
  "attempts",
  "status",
  "payload_json",
  "last_error",
  "worker_id",
  "started_at",
];

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
type JobRow = [
  id: string,
  enqueued_at: string,
  type: string,
  priority: number,
  next_run_at: string,
  attempts: number,
  status: Status,
  payload_json: string,
  last_error: string,
  worker_id: string,
  started_at: string,
];

interface Job {
  id: string;
  enqueuedAt: Date;
  type: string;
  priority: number;
  nextRunAt: Date;
  attempts: number;
  status: Status;
  payload: unknown;
  lastError: string;
  workerId: string;
  startedAt?: Date | null;
}

// Example job types used below — customise for your project
const JOB_TYPE = {
  EDIT_EVENT: "EDIT_EVENT",
  UPDATE_BALANCES: "UPDATE_BALANCES",
} as const;

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────
/** Ensure queue & dead‑letter sheets, headers, and a minute worker trigger. */
export function queue_ensureSetup(): void {
  const ss = SpreadsheetApp.getActive();
  const ensureSheet = (name: string) => ss.getSheetByName(name) || ss.insertSheet(name);

  const queueSheet = ensureSheet(QUEUE_SHEET_NAME);
  ensureHeaders_(queueSheet);
  queueSheet.hideSheet();

  const deadSheet = ensureSheet(DEAD_SHEET_NAME);
  ensureHeaders_(deadSheet);
  deadSheet.hideSheet();

  ensureWorkerTrigger_();
}

/** Enqueue a job */
function queue_enqueue(
  type: string,
  payload: unknown,
  opts?: { priority?: number; runAt?: Date },
): string {
  const priority = typeof opts?.priority === "number" ? opts!.priority : DEFAULT_PRIORITY;
  const runAt = opts?.runAt instanceof Date ? opts!.runAt : new Date();
  const sheet = getQueueSheet_();

  const id = generateId_();
  const row: JobRow = [
    id,
    toIso_(new Date()),
    String(type),
    priority,
    toIso_(runAt),
    0,
    STATUS.PENDING,
    JSON.stringify(payload ?? {}),
    "",
    "",
    "",
  ];

  sheet.appendRow(row);
  return id;
}

/** Time‑driven worker entrypoint (set to run each minute). */
function queue_worker(): void {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(timeConstants.FIVE_SECONDS)) return; // skip if another worker holds the lock
  try {
    processQueueBatch_(MAX_BATCH, WORKER_BUDGET_MS);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/** Optional: example onEdit hook that enqueues a lightweight job. */
function queue_onEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
  try {
    const r = e.range;
    const payload = {
      sheetName: r.getSheet().getName(),
      a1: r.getA1Notation(),
      user: e.user || null,
      value: "value" in e ? (e as any).value ?? null : null,
      oldValue: "oldValue" in e ? (e as any).oldValue ?? null : null,
    };
    queue_enqueue(JOB_TYPE.EDIT_EVENT, payload, { priority: 80 });
  } catch (err) {
    console.error("queue_onEdit error", err);
  }
}

/** Prune DONE/ERROR jobs older than N days (defaults to PRUNE_AFTER_DAYS). */
function queue_purgeDoneOlderThanDays(days: number = PRUNE_AFTER_DAYS): number {
  const sheet = getQueueSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues() as JobRow[];
  const cutoff = Date.now() - days * timeConstants.ONE_DAY;

  const toDelete: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const status = String(data[i][Col.STATUS - 1]) as Status;
    const enqIso = String(data[i][Col.ENQUEUED_AT - 1]);
    const enq = parseIso_(enqIso)?.getTime() ?? 0;
    if ((status === STATUS.DONE || status === STATUS.ERROR) && enq < cutoff) {
      toDelete.push(i + 2);
    }
  }
  toDelete.sort((a, b) => b - a).forEach((row) => sheet.deleteRow(row));
  return toDelete.length;
}

// ───────────────────────────────────────────────────────────────────────────────
// Internal: worker implementation
// ───────────────────────────────────────────────────────────────────────────────
function processQueueBatch_(maxJobs: number, budgetMs: number): void {
  const started = Date.now();
  const now = new Date();
  const sheet = getQueueSheet_();

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return; // headers only

  const range = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  const values = range.getValues() as JobRow[];

  // filter runnable jobs
  const runnable = values
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => {
      const status = String(row[Col.STATUS - 1]) as Status;
      if (status !== STATUS.PENDING) return false;
      const nextRun = parseIso_(String(row[Col.NEXT_RUN_AT - 1]));
      return !nextRun || nextRun <= now;
    });

  if (!runnable.length) return;

  // sort by priority asc then enqueued_at asc
  runnable.sort((a, b) => {
    const pa = Number(a.row[Col.PRIORITY - 1]) || DEFAULT_PRIORITY;
    const pb = Number(b.row[Col.PRIORITY - 1]) || DEFAULT_PRIORITY;
    if (pa !== pb) return pa - pb;
    return String(a.row[Col.ENQUEUED_AT - 1]).localeCompare(String(b.row[Col.ENQUEUED_AT - 1]));
  });

  // claim jobs (small N, individual writes are OK)
  const toClaim = runnable.slice(0, Math.min(maxJobs, runnable.length));
  const workerId = `w-${Utilities.getUuid().slice(0, 8)}`;
  for (const item of toClaim) {
    const absRow = item.idx + 2;
    sheet.getRange(absRow, Col.STATUS).setValue(STATUS.RUNNING);
    sheet.getRange(absRow, Col.WORKER_ID).setValue(workerId);
    sheet.getRange(absRow, Col.STARTED_AT).setValue(toIso_(new Date()));
  }
  SpreadsheetApp.flush();

  // process jobs
  for (const item of toClaim) {
    if (Date.now() - started > budgetMs) break;
    const absRow = item.idx + 2;
    const data = sheet.getRange(absRow, 1, 1, HEADERS.length).getValues()[0] as JobRow;
    const job = rowToJob_(data);

    try {
      dispatchJob_(job);
      sheet.getRange(absRow, Col.STATUS).setValue(STATUS.DONE);
      sheet.getRange(absRow, Col.LAST_ERROR).setValue("");
    } catch (err) {
      const attempts = Number(job.attempts) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        sheet.getRange(absRow, Col.STATUS).setValue(STATUS.ERROR);
        sheet.getRange(absRow, Col.LAST_ERROR).setValue(String(err));
        moveToDeadIfConfigured_(absRow, data);
        continue;
      }
      // schedule retry with backoff + jitter
      const backoff = Math.min(
        MAX_BACKOFF_MS,
        Math.round(DEFAULT_BACKOFF_MS * Math.pow(2, attempts - 1)),
      );
      const jitter = Math.floor(Math.random() * timeConstants.THREE_SECONDS); // up to 3s jitter to de‑sync workers
      const next = new Date(Date.now() + backoff + jitter);

      sheet.getRange(absRow, Col.ATTEMPTS).setValue(attempts);
      sheet.getRange(absRow, Col.NEXT_RUN_AT).setValue(toIso_(next));
      sheet.getRange(absRow, Col.STATUS).setValue(STATUS.PENDING);
      sheet.getRange(absRow, Col.LAST_ERROR).setValue(String(err));
    }
  }
}

function dispatchJob_(job: Job): void {
  switch (job.type) {
    case JOB_TYPE.EDIT_EVENT:
      handle_EDIT_EVENT_(job.payload as any);
      return;
    case JOB_TYPE.UPDATE_BALANCES:
      handle_UPDATE_BALANCES_(job.payload as any);
      return;
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Example handlers — replace with your real work
// ───────────────────────────────────────────────────────────────────────────────
function handle_EDIT_EVENT_(payload: any): void {
  // Minimal example: do nothing or log
  // Logger.log(JSON.stringify({type: JOB_TYPE.EDIT_EVENT, payload}));
}

function handle_UPDATE_BALANCES_(payload: any): void {
  // Call your project logic here
  // OurFinances.updateBalanceValues(); // example
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function getQueueSheet_(): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(QUEUE_SHEET_NAME);
  if (!sheet) throw new Error("Queue sheet missing. Run queue_ensureSetup().");
  return sheet;
}

function ensureHeaders_(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  const existing = range.getValues()[0] as string[];
  const needs = HEADERS.some((h, i) => existing[i] !== h);
  if (needs) {
    range.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function ensureWorkerTrigger_(): void {
  const triggers = ScriptApp.getProjectTriggers();
  const existing = triggers.find((t) => t.getHandlerFunction() === "queue_worker");
  if (!existing) {
    ScriptApp.newTrigger("queue_worker").timeBased().everyMinutes(1).create();
  }
}

function moveToDeadIfConfigured_(absRow: number, row: JobRow): void {
  const ss = SpreadsheetApp.getActive();
  const dead = ss.getSheetByName(DEAD_SHEET_NAME);
  if (!dead) return;
  const values = (row as unknown as any[][]) || [];
  dead.appendRow(values.length ? (values as any) : (getQueueSheet_().getRange(absRow, 1, 1, HEADERS.length).getValues()[0] as any));
}

function rowToJob_(r: JobRow): Job {
  return {
    id: String(r[Col.ID - 1] ?? ""),
    enqueuedAt: parseIso_(String(r[Col.ENQUEUED_AT - 1])),
    type: String(r[Col.TYPE - 1] ?? ""),
    priority: Number(r[Col.PRIORITY - 1]) || DEFAULT_PRIORITY,
    nextRunAt: parseIso_(String(r[Col.NEXT_RUN_AT - 1])),
    attempts: Number(r[Col.ATTEMPTS - 1]) || 0,
    status: String(r[Col.STATUS - 1] ?? STATUS.PENDING) as Status,
    payload: parseJsonSafe_(String(r[Col.PAYLOAD_JSON - 1] || "{}")),
    lastError: String(r[Col.LAST_ERROR - 1] || ""),
    workerId: String(r[Col.WORKER_ID - 1] || ""),
    startedAt: parseIso_(String(r[Col.STARTED_AT - 1] || "")) ?? null,
  };
}

function generateId_(): string { return Utilities.getUuid(); }
function toIso_(d: Date): string { return d.toISOString(); }
function parseIso_(s: string): Date { return s ? new Date(s) : new Date(); }
function parseJsonSafe_(s: string): unknown { try { return JSON.parse(s); } catch { return {}; } }

// ───────────────────────────────────────────────────────────────────────────────
// Export entrypoints to global for triggers & manual runs
// ───────────────────────────────────────────────────────────────────────────────
(function exportToGlobal() {
  const g = (globalThis as any);
  Object.assign(g, {
    queue_ensureSetup,
    queue_enqueue,
    queue_worker,
    queue_onEdit,
    queue_purgeDoneOlderThanDays,
  });
})();
