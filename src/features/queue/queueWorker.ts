// @queue/queueWorker.ts

import { toIso_ } from "@lib/dates";
import { getErrorMessage } from "@lib/errors";
import * as timeConstants from "@lib/timeConstants";
import { FastLog } from "@logging";
import type { RunStepJob, SerializedRunStepParameters } from "@workflow";
import { setupWorkflows } from "@workflow";
import { runStep } from "@workflow/workflowEngine";
import {getSheetByName} from "@gas";
import {
  COL,
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
import type { Job, JobRow, JobStatus } from "./queueTypes";

const MAX_CELL_LENGTH = 2000;

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/** Time‑driven worker entrypoint (set to run each minute). */
export function queueWorker(): void {
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

export function purgeQueuesOldData() {
  const queueSheetNames = [DEAD_SHEET_NAME, QUEUE_SHEET_NAME];
  for (const queueSheetName of queueSheetNames) {
    const queueSheet = getSheetByName(queueSheetName);
    purgeQueueOlderThanDays(queueSheet, PRUNE_AFTER_DAYS);
  }
}

/** Prune DONE/ERROR jobs older than N days (defaults to PRUNE_AFTER_DAYS). */
function purgeQueueOlderThanDays(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  days: number = PRUNE_AFTER_DAYS
): number {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const data = sheet
    .getRange(2, 1, lastRow - 1, HEADERS.length)
    .getValues() as JobRow[];
  const cutoff = Date.now() - days * timeConstants.ONE_DAY;

  const toDelete: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const status = String(data[i][COL.STATUS - 1]) as JobStatus;
    const enqIso = String(data[i][COL.ENQUEUED_AT - 1]);
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
  const fn = processQueueBatch_.name;
  const startTime = FastLog.start(fn);
  try {
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
        const status = String(row[COL.STATUS - 1]) as JobStatus;
        if (status !== STATUS.PENDING) return false;
        const nextRun = parseIsoMaybe_(String(row[COL.NEXT_RUN_AT - 1]));
        return !nextRun || nextRun <= now; // null = run now
      });

    if (!runnable.length) return;

    // sort by priority asc then enqueued_at asc
    runnable.sort((a, b) => {
      const pa = Number(a.row[COL.PRIORITY - 1]) || DEFAULT_PRIORITY;
      const pb = Number(b.row[COL.PRIORITY - 1]) || DEFAULT_PRIORITY;
      if (pa !== pb) return pa - pb;
      return String(a.row[COL.ENQUEUED_AT - 1]).localeCompare(
        String(b.row[COL.ENQUEUED_AT - 1])
      );
    });

    // claim jobs (small N, individual writes are OK)
    const toClaim = runnable.slice(0, Math.min(maxJobs, runnable.length));
    const workerId = `w-${Utilities.getUuid().slice(0, 8)}`;
    for (const item of toClaim) {
      const absRow = item.idx + 2;
      sheet.getRange(absRow, COL.STATUS).setValue(STATUS.RUNNING);
      sheet.getRange(absRow, COL.WORKER_ID).setValue(workerId);
      sheet.getRange(absRow, COL.STARTED_AT).setValue(toIso_(new Date()));
    }
    SpreadsheetApp.flush();

    // Track which rows we actually started
    const startedRows = new Set<number>();

    // process jobs
    for (const item of toClaim) {
      if (Date.now() - started > budgetMs) break;
      const absRow = item.idx + 2;
      startedRows.add(absRow);
      const data = sheet
        .getRange(absRow, 1, 1, HEADERS.length)
        .getValues()[0] as JobRow;
      const job = rowToJob_(data);

      try {
        dispatchJob_(job);
        sheet.getRange(absRow, COL.STATUS).setValue(STATUS.DONE);
        sheet.getRange(absRow, COL.LAST_ERROR).setValue("");
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        FastLog.error(fn, errorMessage);
        const attempts = Number(job.attempts) + 1;
        FastLog.info(`attempts: ${attempts}`);
        if (attempts >= MAX_ATTEMPTS) {
          sheet.getRange(absRow, COL.ATTEMPTS).setValue(attempts);
          sheet.getRange(absRow, COL.STATUS).setValue(STATUS.ERROR);
          sheet
            .getRange(absRow, COL.LAST_ERROR)
            .setValue(toCellMsg_(errorMessage));
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

        sheet.getRange(absRow, COL.ATTEMPTS).setValue(attempts);
        sheet.getRange(absRow, COL.NEXT_RUN_AT).setValue(toIso_(next));
        sheet.getRange(absRow, COL.STATUS).setValue(STATUS.PENDING);
        sheet
          .getRange(absRow, COL.LAST_ERROR)
          .setValue(toCellMsg_(errorMessage));
      }
    }

    // Unclaim any rows we set to RUNNING but didn't start
    for (const item of toClaim) {
      const absRow = item.idx + 2;
      if (!startedRows.has(absRow)) {
        sheet.getRange(absRow, COL.STATUS).setValue(STATUS.PENDING);
        sheet.getRange(absRow, COL.WORKER_ID).setValue("");
        sheet.getRange(absRow, COL.STARTED_AT).setValue("");
      }
    }
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, errorMessage);
    throw new Error(errorMessage);
  } finally {
    FastLog.finish(fn, startTime);
  }
}

function dispatchJob_(job: Job): void {
  const fn = dispatchJob_.name;
  const startTime = FastLog.start(fn, job);
  try {
    setupWorkflows();
    const { json_parameters } = job;

    const p = (json_parameters as Partial<SerializedRunStepParameters>) || {};
    const rsj: RunStepJob = {
      workflowId: String(p.workflowId),
      workflowName: String(p.workflowName),
      stepName: String(p.stepName),
      input: p.input,
      state: p.state ?? {},
      attempt: Number(job.attempts) || 0, // ← sheet is source of truth
    };
    runStep(rsj);
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, errorMessage);
    throw new Error(errorMessage);
  } finally {
    FastLog.finish(fn, startTime, `Job ${job.id}`);
  }
  return;
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function getQueueSheet_(): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(QUEUE_SHEET_NAME);
  if (!sheet) throw new Error("Queue sheet missing. Run queueSetup().");
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
  const fn = rowToJob_.name;
  const startTime = FastLog.start(fn, r);
  const job = {
    id: String(r[COL.ID - 1] ?? ""),
    json_parameters: parseJsonSafe_(String(r[COL.JSON_PARAMETERS - 1] || "{}")),
    enqueuedAt: parseIsoMaybe_(String(r[COL.ENQUEUED_AT - 1])) ?? new Date(0),
    priority: Number(r[COL.PRIORITY - 1]) || DEFAULT_PRIORITY,
    nextRunAt: parseIsoMaybe_(String(r[COL.NEXT_RUN_AT - 1])) ?? new Date(0),
    attempts: Number(r[COL.ATTEMPTS - 1]) || 0,
    status: String(r[COL.STATUS - 1] ?? STATUS.PENDING) as JobStatus,
    lastError: String(r[COL.LAST_ERROR - 1] || ""),
    workerId: String(r[COL.WORKER_ID - 1] || ""),
    startedAt: parseIsoMaybe_(String(r[COL.STARTED_AT - 1] || "")), // Date | null
  };
  FastLog.finish(fn, startTime);
  return job;
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

function toCellMsg_(x: unknown, max = MAX_CELL_LENGTH) {
  const s = typeof x === "string" ? x : JSON.stringify(x);
  return (s || "").slice(0, max);
}

// ───────────────────────────────────────────────────────────────────────────────
// Export entrypoints to global for triggers & manual runs
// ───────────────────────────────────────────────────────────────────────────────
(function exportToGlobal() {
  const g = globalThis as any;
  Object.assign(g, {
    queueWorker,
    purgeQueuesOldData,
  });
})();
