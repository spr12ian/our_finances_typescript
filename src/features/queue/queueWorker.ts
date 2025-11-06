// @queue/queueWorker.ts

import { getSheetByName } from "@gas";
import { DateHelper } from "@lib/DateHelper";
import { getErrorMessage } from "@lib/errors";
import { ONE_DAY_MS, ONE_SECOND_MS } from "@lib/timeConstants";
import { withScriptLock } from "@lib/withScriptLock";
import { FastLog, functionStart } from "@logging";
import {
  setupWorkflowsOnce,
  type RunStepJob,
  type SerializedRunStepParameters,
} from "@workflow";
import { runStep } from "@workflow/workflowEngine";
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

/** Time-driven worker entrypoint (set to run each minute). */
export function queueWorker(): void {
  const fn = queueWorker.name;
  try {
    const ready = setupWorkflowsOnce({
      lockTimeoutMs: 200, // or 400, as you prefer
      allowRetryTrigger: true,
    });

    if (!ready) {
      FastLog.warn(fn, "Engine not ready; skipping this tick");
      return;
    }

    // At this point the engine is configured and enqueueFn is wired.
    withScriptLock(() => {
      processQueueBatch_(MAX_BATCH, WORKER_BUDGET_MS);
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, errorMessage);
    throw new Error(errorMessage);
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
  if (lastRow < 2) return 0; // headers only

  const dataRows = lastRow - 1; // number of data rows (row 2..lastRow)
  const dataRange = sheet.getRange(2, 1, dataRows, HEADERS.length);
  const data = dataRange.getValues() as JobRow[];

  const cutoffMs = Date.now() - days * ONE_DAY_MS;

  // Keep rows that are NOT (DONE/ERROR and older than cutoff)
  const keep: JobRow[] = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const status = String(row[COL.STATUS - 1]) as JobStatus;

    const enq = coerceCellToUtcDate_(row[COL.ENQUEUED_AT - 1]);
    const isOldDoneOrError =
      (status === STATUS.DONE || status === STATUS.ERROR) &&
      (enq?.getTime() ?? 0) < cutoffMs;

    if (!isOldDoneOrError) keep.push(row);
  }

  // If we'd remove *all* non-frozen rows, keep one blank to satisfy Sheets
  if (keep.length === 0 && data.length > 0) {
    const blank: any[] = new Array(HEADERS.length).fill("");
    // You can set defaults here if you prefer (e.g., STATUS.PENDING)
    keep.push(blank as JobRow);
  }

  // 1) Overwrite the data block with the "keep" rows (single write)
  if (keep.length > 0) {
    const outRange = sheet.getRange(2, 1, keep.length, HEADERS.length);
    outRange.setValues(keep);
  }

  // 2) If we have fewer rows than before, clear the remainder then delete in one go
  const rowsToRemove = data.length - keep.length;
  if (rowsToRemove > 0) {
    // Clear the remainder to avoid stale values during UI flashes
    const remainderStart = 2 + keep.length;
    sheet
      .getRange(remainderStart, 1, rowsToRemove, HEADERS.length)
      .clearContent();

    // If remainder is the *entire* non-frozen region, don't delete all (error).
    // But because we ensured keep.length >= 1 when data.length > 0, we’re safe.
    // Delete trailing block in a single call (fast).
    // Some containers don't have deleteRows(start, howMany); fallback to loop if needed.
    if (typeof (sheet as any).deleteRows === "function") {
      (sheet as any).deleteRows(remainderStart, rowsToRemove);
    } else {
      // Fallback: descending single-row deletes (rarely needed)
      for (let r = lastRow; r >= remainderStart; r--) {
        sheet.deleteRow(r);
      }
    }
  }

  return rowsToRemove;
}

// ───────────────────────────────────────────────────────────────────────────────
// Internal: worker implementation
// ───────────────────────────────────────────────────────────────────────────────
function processQueueBatch_(maxJobs: number, budgetMs: number): void {
  const fn = processQueueBatch_.name;
  const finish = functionStart(fn);
  try {
    const startedMs = Date.now();
    const nowUtc = new Date(); // comparisons are by epoch ms; storage remains UTC
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
        const nextRun = coerceCellToUtcDate_(row[COL.NEXT_RUN_AT - 1]);
        return !nextRun || nextRun.getTime() <= nowUtc.getTime();
      });

    if (!runnable.length) return;

    // sort by priority asc then enqueued_at asc
    runnable.sort((a, b) => {
      const pa = Number(a.row[COL.PRIORITY - 1]) || DEFAULT_PRIORITY;
      const pb = Number(b.row[COL.PRIORITY - 1]) || DEFAULT_PRIORITY;
      if (pa !== pb) return pa - pb;
      const ea =
        coerceCellToUtcDate_(a.row[COL.ENQUEUED_AT - 1])?.getTime() ?? 0;
      const eb =
        coerceCellToUtcDate_(b.row[COL.ENQUEUED_AT - 1])?.getTime() ?? 0;
      return ea - eb;
    });

    // claim jobs (small N, individual writes are OK)
    const toClaim = runnable.slice(0, Math.min(maxJobs, runnable.length));
    const workerId = `w-${Utilities.getUuid().slice(0, 8)}`;
    for (const item of toClaim) {
      const absRow = item.idx + 2;
      sheet.getRange(absRow, COL.STATUS).setValue(STATUS.RUNNING);
      sheet.getRange(absRow, COL.WORKER_ID).setValue(workerId);
      // STARTED_AT in UTC with display format applied
      DateHelper.writeUtcNow(sheet.getRange(absRow, COL.STARTED_AT));
    }
    SpreadsheetApp.flush();

    // Track which rows we actually started
    const startedRows = new Set<number>();

    // process jobs
    for (const item of toClaim) {
      if (Date.now() - startedMs > budgetMs) break;

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
        FastLog.info(fn, `attempts=${attempts}`);

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
        const jitter = Math.floor(Math.random() * 3 * ONE_SECOND_MS); // de-sync workers
        const nextWhen = new Date(Date.now() + backoff + jitter);

        sheet.getRange(absRow, COL.ATTEMPTS).setValue(attempts);
        // NEXT_RUN_AT in UTC with display format applied
        DateHelper.writeUtc(sheet.getRange(absRow, COL.NEXT_RUN_AT), nextWhen);
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
    finish();
  }
}

function dispatchJob_(job: Job): void {
  const fn = dispatchJob_.name;
  const startTime = FastLog.start(fn, {
    id: job.id,
    at: DateHelper.formatForLog(new Date()),
  });
  try {
    const { payload } = job;

    const p = (payload as Partial<SerializedRunStepParameters>) || {};
    const rsj: RunStepJob = {
      workflowId: String(p.workflowId),
      workflowName: String(p.workflowName),
      stepName: String(p.stepName),
      input: p.input,
      state: p.state ?? {},
      attempt: Number(job.attempts) || 0, // sheet is source of truth
    };
    runStep(rsj);
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, errorMessage);
    throw new Error(errorMessage);
  } finally {
    FastLog.finish(
      fn,
      startTime,
      `Job ${job.id} finished at ${DateHelper.formatForLog(new Date())}`
    );
  }
  return;
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function getQueueSheet_(): GoogleAppsScript.Spreadsheet.Sheet {
  const fn = getQueueSheet_.name;
  const startTime = FastLog.start(fn);
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName(QUEUE_SHEET_NAME);
    if (!sheet) throw new Error("Queue sheet missing. Run queueSetup().");
    return sheet;
  } finally {
    FastLog.finish(fn, startTime);
  }
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
  const startTime = FastLog.start(fn);
  const job = {
    id: String(r[COL.ID - 1] ?? ""),
    payload: parseJsonSafe_(String(r[COL.JSON_PAYLOAD - 1] || "{}")),
    enqueuedAt: coerceCellToUtcDate_(r[COL.ENQUEUED_AT - 1]) ?? new Date(0),
    priority: Number(r[COL.PRIORITY - 1]) || DEFAULT_PRIORITY,
    nextRunAt: coerceCellToUtcDate_(r[COL.NEXT_RUN_AT - 1]),
    attempts: Number(r[COL.ATTEMPTS - 1]) || 0,
    status: String(r[COL.STATUS - 1] ?? STATUS.PENDING) as JobStatus,
    lastError: String(r[COL.LAST_ERROR - 1] || ""),
    workerId: String(r[COL.WORKER_ID - 1] || ""),
    startedAt: coerceCellToUtcDate_(r[COL.STARTED_AT - 1]),
  };
  FastLog.finish(fn, startTime);
  return job;
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

// Convert a cell value (Date|string|other) into a UTC Date or null using DateHelper rules.
function coerceCellToUtcDate_(v: unknown): Date | null {
  if (v instanceof Date) return new Date(v.toISOString()); // normalize to UTC instant
  if (typeof v === "string" && v.trim()) {
    // Try ISO first (with Z/offset), then our display format "dd MMM yyyy HH:mm[:ss]"
    const iso = new Date(v);
    if (!isNaN(iso.getTime()) && /[zZ]|[+\-]\d{2}:\d{2}$/.test(v)) return iso;
    const display = DateHelper.parseDisplayToUtc(v);
    return display ?? null;
  }
  return null;
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
