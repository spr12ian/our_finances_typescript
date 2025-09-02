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
import * as queueConstants from "./queueConstants";
import * as timeConstants from "./timeConstants";
import { UPDATE_BALANCES } from './UPDATE_BALANCES';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
type Status =
  (typeof queueConstants.STATUS)[keyof typeof queueConstants.STATUS];

type JobRow = [
  id: string,
  call: string,
  json_parameters: string,
  enqueued_at: string,
  priority: number,
  next_run_at: string,
  attempts: number,
  status: Status,
  last_error: string,
  worker_id: string,
  started_at: string
];

interface Job {
  id: string;
  call: string;
  parameters: unknown;
  enqueuedAt: Date;
  priority: number;
  nextRunAt: Date;
  attempts: number;
  status: Status;
  lastError: string;
  workerId: string;
  startedAt?: Date | null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────
/** Ensure queue & dead‑letter sheets, headers, and a minute worker trigger. */
export function queue_ensureSetup(): void {
  const ss = SpreadsheetApp.getActive();
  const ensureSheet = (name: string) =>
    ss.getSheetByName(name) || ss.insertSheet(name);

  const queueSheet = ensureSheet(queueConstants.QUEUE_SHEET_NAME);
  ensureHeaders_(queueSheet);
  queueSheet.hideSheet();

  const deadSheet = ensureSheet(queueConstants.DEAD_SHEET_NAME);
  ensureHeaders_(deadSheet);
  deadSheet.hideSheet();

  ensureWorkerTrigger_();
}

/** Enqueue a job */
export function queue_enqueue(
  call: string,
  parameters: unknown,
  opts?: { priority?: number; runAt?: Date }
): string {
  const priority =
    typeof opts?.priority === "number"
      ? opts!.priority
      : queueConstants.DEFAULT_PRIORITY;
  const runAt = opts?.runAt instanceof Date ? opts!.runAt : new Date();
  const sheet = getQueueSheet_();

  const id = generateId_();
  const row: JobRow = [
    id,
    String(call),
    JSON.stringify(parameters ?? {}),
    toIso_(new Date()),
    priority,
    toIso_(runAt),
    0,
    queueConstants.STATUS.PENDING,
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
    processQueueBatch_(
      queueConstants.MAX_BATCH,
      queueConstants.WORKER_BUDGET_MS
    );
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

/** Optional: example onEdit hook that enqueues a lightweight job. */
export function queue_onEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
  try {
    const r = e.range;
    const parameters = {
      sheetName: r.getSheet().getName(),
      a1: r.getA1Notation(),
      user: e.user || null,
      value: "value" in e ? (e as any).value ?? null : null,
      oldValue: "oldValue" in e ? (e as any).oldValue ?? null : null,
    };
    queue_enqueue(queueConstants.FUNCTION_CALLED.UPDATE_BALANCES, parameters, {
      priority: 80,
    });
  } catch (err) {
    console.error("queue_onEdit error", err);
  }
}

/** Prune DONE/ERROR jobs older than N days (defaults to PRUNE_AFTER_DAYS). */
function queue_purgeDoneOlderThanDays(
  days: number = queueConstants.PRUNE_AFTER_DAYS
): number {
  const sheet = getQueueSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const data = sheet
    .getRange(2, 1, lastRow - 1, queueConstants.HEADERS.length)
    .getValues() as JobRow[];
  const cutoff = Date.now() - days * timeConstants.ONE_DAY;

  const toDelete: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const status = String(data[i][queueConstants.Col.STATUS - 1]) as Status;
    const enqIso = String(data[i][queueConstants.Col.ENQUEUED_AT - 1]);
    const enq = parseIso_(enqIso)?.getTime() ?? 0;
    if (
      (status === queueConstants.STATUS.DONE ||
        status === queueConstants.STATUS.ERROR) &&
      enq < cutoff
    ) {
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

  const range = sheet.getRange(
    2,
    1,
    lastRow - 1,
    queueConstants.HEADERS.length
  );
  const values = range.getValues() as JobRow[];

  // filter runnable jobs
  const runnable = values
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => {
      const status = String(row[queueConstants.Col.STATUS - 1]) as Status;
      if (status !== queueConstants.STATUS.PENDING) return false;
      const nextRun = parseIso_(
        String(row[queueConstants.Col.NEXT_RUN_AT - 1])
      );
      return !nextRun || nextRun <= now;
    });

  if (!runnable.length) return;

  // sort by priority asc then enqueued_at asc
  runnable.sort((a, b) => {
    const pa =
      Number(a.row[queueConstants.Col.PRIORITY - 1]) ||
      queueConstants.DEFAULT_PRIORITY;
    const pb =
      Number(b.row[queueConstants.Col.PRIORITY - 1]) ||
      queueConstants.DEFAULT_PRIORITY;
    if (pa !== pb) return pa - pb;
    return String(a.row[queueConstants.Col.ENQUEUED_AT - 1]).localeCompare(
      String(b.row[queueConstants.Col.ENQUEUED_AT - 1])
    );
  });

  // claim jobs (small N, individual writes are OK)
  const toClaim = runnable.slice(0, Math.min(maxJobs, runnable.length));
  const workerId = `w-${Utilities.getUuid().slice(0, 8)}`;
  for (const item of toClaim) {
    const absRow = item.idx + 2;
    sheet
      .getRange(absRow, queueConstants.Col.STATUS)
      .setValue(queueConstants.STATUS.RUNNING);
    sheet.getRange(absRow, queueConstants.Col.WORKER_ID).setValue(workerId);
    sheet
      .getRange(absRow, queueConstants.Col.STARTED_AT)
      .setValue(toIso_(new Date()));
  }
  SpreadsheetApp.flush();

  // process jobs
  for (const item of toClaim) {
    if (Date.now() - started > budgetMs) break;
    const absRow = item.idx + 2;
    const data = sheet
      .getRange(absRow, 1, 1, queueConstants.HEADERS.length)
      .getValues()[0] as JobRow;
    const job = rowToJob_(data);

    try {
      dispatchJob_(job);
      sheet
        .getRange(absRow, queueConstants.Col.STATUS)
        .setValue(queueConstants.STATUS.DONE);
      sheet.getRange(absRow, queueConstants.Col.LAST_ERROR).setValue("");
    } catch (err) {
      const attempts = Number(job.attempts) + 1;
      if (attempts >= queueConstants.MAX_ATTEMPTS) {
        sheet
          .getRange(absRow, queueConstants.Col.STATUS)
          .setValue(queueConstants.STATUS.ERROR);
        sheet
          .getRange(absRow, queueConstants.Col.LAST_ERROR)
          .setValue(String(err));
        moveToDeadIfConfigured_(absRow, data);
        continue;
      }
      // schedule retry with backoff + jitter
      const backoff = Math.min(
        queueConstants.MAX_BACKOFF_MS,
        Math.round(
          queueConstants.DEFAULT_BACKOFF_MS * Math.pow(2, attempts - 1)
        )
      );
      const jitter = Math.floor(Math.random() * timeConstants.THREE_SECONDS); // up to 3s jitter to de‑sync workers
      const next = new Date(Date.now() + backoff + jitter);

      sheet.getRange(absRow, queueConstants.Col.ATTEMPTS).setValue(attempts);
      sheet
        .getRange(absRow, queueConstants.Col.NEXT_RUN_AT)
        .setValue(toIso_(next));
      sheet
        .getRange(absRow, queueConstants.Col.STATUS)
        .setValue(queueConstants.STATUS.PENDING);
      sheet
        .getRange(absRow, queueConstants.Col.LAST_ERROR)
        .setValue(String(err));
    }
  }
}

function dispatchJob_(job: Job): void {
  switch (job.call) {
    case queueConstants.FUNCTION_CALLED.UPDATE_BALANCES:
      UPDATE_BALANCES(job.parameters as any);
      return;
    default:
      throw new Error(`Unknown job call: ${job.call}`);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function getQueueSheet_(): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(queueConstants.QUEUE_SHEET_NAME);
  if (!sheet) throw new Error("Queue sheet missing. Run queue_ensureSetup().");
  return sheet;
}

function ensureHeaders_(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
  const range = sheet.getRange(1, 1, 1, queueConstants.HEADERS.length);
  const existing = range.getValues()[0] as string[];
  const needs = queueConstants.HEADERS.some((h, i) => existing[i] !== h);
  if (needs) {
    range.setValues([queueConstants.HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function ensureWorkerTrigger_(): void {
  const triggers = ScriptApp.getProjectTriggers();
  const existing = triggers.find(
    (t) => t.getHandlerFunction() === "queue_worker"
  );
  if (!existing) {
    ScriptApp.newTrigger("queue_worker").timeBased().everyMinutes(1).create();
  }
}

function moveToDeadIfConfigured_(absRow: number, row: JobRow): void {
  const ss = SpreadsheetApp.getActive();
  const dead = ss.getSheetByName(queueConstants.DEAD_SHEET_NAME);
  if (!dead) return;
  const values = (row as unknown as any[][]) || [];
  dead.appendRow(
    values.length
      ? (values as any)
      : (getQueueSheet_()
          .getRange(absRow, 1, 1, queueConstants.HEADERS.length)
          .getValues()[0] as any)
  );
}

function rowToJob_(r: JobRow): Job {
  return {
    id: String(r[queueConstants.Col.ID - 1] ?? ""),
    enqueuedAt: parseIso_(String(r[queueConstants.Col.ENQUEUED_AT - 1])),
    call: String(r[queueConstants.Col.CALL - 1] ?? ""),
    priority:
      Number(r[queueConstants.Col.PRIORITY - 1]) ||
      queueConstants.DEFAULT_PRIORITY,
    nextRunAt: parseIso_(String(r[queueConstants.Col.NEXT_RUN_AT - 1])),
    attempts: Number(r[queueConstants.Col.ATTEMPTS - 1]) || 0,
    status: String(
      r[queueConstants.Col.STATUS - 1] ?? queueConstants.STATUS.PENDING
    ) as Status,
    parameters: parseJsonSafe_(
      String(r[queueConstants.Col.JSON_PARAMETERS - 1] || "{}")
    ),
    lastError: String(r[queueConstants.Col.LAST_ERROR - 1] || ""),
    workerId: String(r[queueConstants.Col.WORKER_ID - 1] || ""),
    startedAt:
      parseIso_(String(r[queueConstants.Col.STARTED_AT - 1] || "")) ?? null,
  };
}

function generateId_(): string {
  return Utilities.getUuid();
}
function toIso_(d: Date): string {
  return d.toISOString();
}
function parseIso_(s: string): Date {
  return s ? new Date(s) : new Date();
}
function parseJsonSafe_(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Export entrypoints to global for triggers & manual runs
// ───────────────────────────────────────────────────────────────────────────────
(function exportToGlobal() {
  const g = globalThis as any;
  Object.assign(g, {
    queue_ensureSetup,
    queue_enqueue,
    queue_worker,
    queue_onEdit,
    queue_purgeDoneOlderThanDays,
  });
})();

