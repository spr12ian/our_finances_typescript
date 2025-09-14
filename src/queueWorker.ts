// queueWorker.ts

/// <reference types="google-apps-script" />

// ───────────────────────────────────────────────────────────────────────────────
// Constants & schema
// ───────────────────────────────────────────────────────────────────────────────
import { toIso_ } from "./DateFunctions";
import type { Handler, Job, JobRow, JobStatus } from "./queueTypes";
import * as timeConstants from "./timeConstants";
import { jobHandlers } from "./workflow/workflowHandlers";

import { FastLog } from "./lib/FastLog";
import {
  Col,
  DEAD_SHEET_NAME,
  DEFAULT_BACKOFF_MS,
  DEFAULT_PRIORITY,
  HEADERS,
  MAX_ATTEMPTS,
  MAX_BACKOFF_MS,
  MAX_BATCH,
  PRUNE_AFTER_DAYS,
  QUEUE_SHEET_NAME,
  STATUS,
  WORKER_BUDGET_MS,
} from "./queueConstants";

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/** Time‑driven worker entrypoint (set to run each minute). */
export function queue_worker(): void {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(timeConstants.FIVE_SECONDS)) return; // skip if another worker holds the lock
  try {
    processQueueBatch_(MAX_BATCH, WORKER_BUDGET_MS);
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

/** Prune DONE/ERROR jobs older than N days (defaults to PRUNE_AFTER_DAYS). */
function queue_purgeDoneOlderThanDays(days: number = PRUNE_AFTER_DAYS): number {
  const sheet = getQueueSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const data = sheet
    .getRange(2, 1, lastRow - 1, HEADERS.length)
    .getValues() as JobRow[];
  const cutoff = Date.now() - days * timeConstants.ONE_DAY;

  const toDelete: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const status = String(data[i][Col.STATUS - 1]) as JobStatus;
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
      const status = String(row[Col.STATUS - 1]) as JobStatus;
      if (status !== STATUS.PENDING) return false;
      const nextRun = parseIsoMaybe_(String(row[Col.NEXT_RUN_AT - 1]));
      return !nextRun || nextRun <= now; // null = run now
    });

  if (!runnable.length) return;

  // sort by priority asc then enqueued_at asc
  runnable.sort((a, b) => {
    const pa = Number(a.row[Col.PRIORITY - 1]) || DEFAULT_PRIORITY;
    const pb = Number(b.row[Col.PRIORITY - 1]) || DEFAULT_PRIORITY;
    if (pa !== pb) return pa - pb;
    return String(a.row[Col.ENQUEUED_AT - 1]).localeCompare(
      String(b.row[Col.ENQUEUED_AT - 1])
    );
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
    const data = sheet
      .getRange(absRow, 1, 1, HEADERS.length)
      .getValues()[0] as JobRow;
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
        moveToDeadIfConfigured_(absRow);
        continue;
      }
      // schedule retry with backoff + jitter
      const backoff = Math.min(
        MAX_BACKOFF_MS,
        Math.round(DEFAULT_BACKOFF_MS * Math.pow(2, attempts - 1))
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
  const handler: Handler | undefined = (jobHandlers as any)[job.jobName];
  if (!handler) throw new Error(`Unknown job: ${job.jobName}`);

  const started = Date.now();
  handler(job.parameters as any);
  const duration = Date.now() - started;
  FastLog.log(`Job ${job.id} (${job.jobName}) completed in ${duration}ms`);
  return;
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

function moveToDeadIfConfigured_(absRow: number): void {
  const ss = SpreadsheetApp.getActive();
  const dead = ss.getSheetByName(DEAD_SHEET_NAME);
  if (!dead) return;

  const queueSheet = getQueueSheet_();
  const rowVals = queueSheet
    .getRange(absRow, 1, 1, HEADERS.length)
    .getValues()[0];

  dead.appendRow(rowVals);
  queueSheet.deleteRow(absRow);
}

function rowToJob_(r: JobRow): Job {
  return {
    id: String(r[Col.ID - 1] ?? ""),
    jobName: String(r[Col.JOB_NAME - 1] ?? "") as any,
    parameters: parseJsonSafe_(String(r[Col.JSON_PARAMETERS - 1] || "{}")),
    enqueuedAt: parseIsoMaybe_(String(r[Col.ENQUEUED_AT - 1])) ?? new Date(0),
    priority: Number(r[Col.PRIORITY - 1]) || DEFAULT_PRIORITY,
    nextRunAt: parseIsoMaybe_(String(r[Col.NEXT_RUN_AT - 1])) ?? new Date(0),
    attempts: Number(r[Col.ATTEMPTS - 1]) || 0,
    status: String(r[Col.STATUS - 1] ?? STATUS.PENDING) as JobStatus,
    lastError: String(r[Col.LAST_ERROR - 1] || ""),
    workerId: String(r[Col.WORKER_ID - 1] || ""),
    startedAt: parseIsoMaybe_(String(r[Col.STARTED_AT - 1] || "")), // Date | null
  };
}

function parseIso_(s: string): Date {
  return s ? new Date(s) : new Date();
}

function parseIsoMaybe_(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
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
    queue_worker,
    queue_purgeDoneOlderThanDays,
  });
})();
