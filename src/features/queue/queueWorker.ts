// @queue/queueWorker.ts

import { DateHelper } from "@lib/DateHelper";
import { getErrorMessage } from "@lib/errors";
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { withScriptLock } from "@lib/withScriptLock";
import { FastLog, withLog } from "@logging";
import {
  setupWorkflowsOnce,
  type RunStepJob,
  type SerializedRunStepParameters,
} from "@workflow";
import { runStep } from "@workflow/workflowEngine";
import { getQueueSheet } from "./getQueueSheet";
import {
  COLUMNS,
  DEFAULT_BACKOFF_MS,
  DEFAULT_PRIORITY,
  HEADERS,
  MAX_ATTEMPTS,
  MAX_BACKOFF_MS,
  MAX_BATCH,
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
      withLog(fn, processQueueBatch_)(MAX_BATCH, WORKER_BUDGET_MS);
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, errorMessage);
    throw new Error(errorMessage);
  }
}

function getLastDataRow_(sheet: GoogleAppsScript.Spreadsheet.Sheet): number {
  const fn = getLastDataRow_.name;
  const start = FastLog.start(fn);

  try {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return 1; // headers only

    const height = lastRow - 1; // number of data rows
    const statusRange = sheet.getRange(2, COLUMNS.STATUS, height, 1);
    const statusValues = statusRange.getValues(); // [[val], [val], ...]

    for (let i = statusValues.length - 1; i >= 0; i--) {
      const v = String(statusValues[i][0] ?? "").trim();
      if (v !== "") {
        return i + 2; // convert index into row (2-based data start)
      }
    }

    // All status cells empty ⇒ treat as no data rows
    return 1;
  } finally {
    FastLog.finish(fn, start);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Internal: worker implementation
// ───────────────────────────────────────────────────────────────────────────────

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

function processQueueBatch_(maxJobs: number, budgetMs: number): void {
  const fn = processQueueBatch_.name;

  const startedMs = Date.now();
  const nowUtc = new Date();
  const nowMs = nowUtc.getTime();
  const sheet = getQueueSheet();
  const gasSheet = sheet.raw;

  const lastDataRow = getLastDataRow_(gasSheet);
  if (lastDataRow < 2) {
    FastLog.log(fn, "No data rows (headers only or all blank); exiting");
    return;
  }

  const height = lastDataRow - 1; // data rows count (row 2..lastDataRow)
  const range = gasSheet.getRange(2, 1, height, HEADERS.length);
  const values = range.getValues() as JobRow[];

  // Build runnable list with a single pass over in-memory values
  const runnable: { row: JobRow; idx: number }[] = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const status = String(row[COLUMNS.STATUS - 1]) as JobStatus;

    if (status !== STATUS.PENDING) continue;

    const nextRun = DateHelper.coerceCellToUtcDate(row[COLUMNS.NEXT_RUN_AT - 1]);
    if (nextRun && nextRun.getTime() > nowMs) continue;

    runnable.push({ row, idx: i });
  }

  FastLog.log(
    fn,
    `Scanned ${values.length} rows → runnable=${runnable.length}`
  );

  if (!runnable.length) {
    FastLog.log(fn, "No runnable jobs; exiting");
    return;
  }

  // sort by priority asc then enqueued_at asc
  runnable.sort((a, b) => {
    const pa = Number(a.row[COLUMNS.PRIORITY - 1]) || DEFAULT_PRIORITY;
    const pb = Number(b.row[COLUMNS.PRIORITY - 1]) || DEFAULT_PRIORITY;
    if (pa !== pb) return pa - pb;

    const ea =
      DateHelper.coerceCellToUtcDate(a.row[COLUMNS.QUEUED_AT - 1])?.getTime() ??
      0;
    const eb =
      DateHelper.coerceCellToUtcDate(b.row[COLUMNS.QUEUED_AT - 1])?.getTime() ??
      0;
    return ea - eb;
  });

  const toClaimCount = Math.min(maxJobs, runnable.length);
  const toClaim = runnable.slice(0, toClaimCount);
  const workerId = `w-${Utilities.getUuid().slice(0, 8)}`;

  FastLog.info(
    fn,
    `Claiming ${toClaim.length} job(s) (workerId=${workerId}, maxJobs=${maxJobs}, budgetMs=${budgetMs})`
  );

  // ── 1) CLAIM in-memory, then commit once ──────────────────────────────
  const nowForStart = new Date();
  for (const item of toClaim) {
    const idx = item.idx; // 0-based into values[]
    const row = values[idx];

    row[COLUMNS.STATUS - 1] = STATUS.RUNNING;
    row[COLUMNS.WORKER_ID - 1] = workerId;

    // How to apply the format here?
    // const DISPLAY_DATE_FORMAT = "dd MMM yyyy HH:mm:ss";
    // COLUMNS.STARTED_AT.setNumberFormat(DISPLAY_DATE_FORMAT);
    row[COLUMNS.STARTED_AT - 1] = nowForStart; // Date; relies on existing number format
  }

  // Commit RUNNING state so other workers see the claim
  range.setValues(values);
  SpreadsheetApp.flush();

  // ── 2) PROCESS jobs, mutating `values` as we go ───────────────────────
  const startedIndices = new Set<number>(); // 0-based indices into values[]

  let succeeded = 0;
  let retried = 0;
  let movedToDead = 0; // logical count; see note below
  let timedOutBeforeStart = 0;

  for (const item of toClaim) {
    const elapsed = Date.now() - startedMs;
    if (elapsed > budgetMs) {
      timedOutBeforeStart++;
      FastLog.warn(
        fn,
        `Budget exhausted before starting idx=${item.idx} (elapsedMs=${elapsed}, budgetMs=${budgetMs})`
      );
      break; // anything after this is claimed but never started
    }

    const idx = item.idx;
    const row = values[idx];

    startedIndices.add(idx);

    const job = rowToJob_(row);

    try {
      dispatchJob_(job);
      succeeded++;

      row[COLUMNS.STATUS - 1] = STATUS.DONE;
      row[COLUMNS.LAST_ERROR - 1] = "";

      // Optionally: leave WORKER_ID/STARTED_AT as an audit trail
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      FastLog.error(fn, errorMessage);

      const attempts = Number(job.attempts) + 1;
      row[COLUMNS.ATTEMPTS - 1] = attempts;

      if (attempts >= MAX_ATTEMPTS) {
        // Permanently failed
        row[COLUMNS.STATUS - 1] = STATUS.ERROR;
        row[COLUMNS.LAST_ERROR - 1] = toCellMsg_(errorMessage);
        movedToDead++; // logically “perma failed”; actual move-to-dead can be a separate pass
        continue;
      }

      // schedule retry with backoff + jitter
      const backoff = Math.min(
        MAX_BACKOFF_MS,
        Math.round(DEFAULT_BACKOFF_MS * Math.pow(2, attempts - 1))
      );
      const jitter = Math.floor(Math.random() * 3 * ONE_SECOND_MS);
      const nextWhen = new Date(Date.now() + backoff + jitter);

      retried++;
      row[COLUMNS.NEXT_RUN_AT - 1] = nextWhen; // Date; relies on cell format
      row[COLUMNS.STATUS - 1] = STATUS.PENDING;
      row[COLUMNS.LAST_ERROR - 1] = toCellMsg_(errorMessage);
    }
  }

  // ── 3) UNCLAIM rows we never started ──────────────────────────────────
  // Any toClaim row whose index is *not* in startedIndices was marked
  // RUNNING earlier but never actually processed (budget overrun, early
  // exception, etc.). Restore them to PENDING and wipe worker/startedAt.
  for (const item of toClaim) {
    const idx = item.idx;
    if (startedIndices.has(idx)) continue;

    const row = values[idx];
    row[COLUMNS.STATUS - 1] = STATUS.PENDING;
    row[COLUMNS.WORKER_ID - 1] = "";
    row[COLUMNS.STARTED_AT - 1] = "";
  }

  // ── 4) Final commit of all updated rows ───────────────────────────────
  range.setValues(values);

  const totalElapsed = Date.now() - startedMs;
  FastLog.info(
    fn,
    `Batch summary: totalRows=${values.length}, runnable=${runnable.length}, ` +
      `claimed=${toClaim.length}, started=${startedIndices.size}, ` +
      `succeeded=${succeeded}, retried=${retried}, movedToDead=${movedToDead}, ` +
      `timedOutBeforeStart=${timedOutBeforeStart}, elapsedMs=${totalElapsed}`
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function rowToJob_(r: JobRow): Job {
  const fn = rowToJob_.name;
  const startTime = FastLog.start(fn);
  const job = {
    id: String(r[COLUMNS.ID - 1] ?? ""),
    queuedAt:
      DateHelper.coerceCellToUtcDate(r[COLUMNS.QUEUED_AT - 1]) ?? new Date(0),
    queuedBy: String(r[COLUMNS.QUEUED_BY - 1] || ""),
    payload: parseJsonSafe_(String(r[COLUMNS.PAYLOAD - 1] || "{}")),
    priority: Number(r[COLUMNS.PRIORITY - 1]) || DEFAULT_PRIORITY,
    nextRunAt: DateHelper.coerceCellToUtcDate(r[COLUMNS.NEXT_RUN_AT - 1]),
    attempts: Number(r[COLUMNS.ATTEMPTS - 1]) || 0,
    status: String(r[COLUMNS.STATUS - 1] ?? STATUS.PENDING) as JobStatus,
    lastError: String(r[COLUMNS.LAST_ERROR - 1] || ""),
    workerId: String(r[COLUMNS.WORKER_ID - 1] || ""),
    startedAt: DateHelper.coerceCellToUtcDate(r[COLUMNS.STARTED_AT - 1]),
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

// ───────────────────────────────────────────────────────────────────────────────
// Export entrypoints to global for triggers & manual runs
// ───────────────────────────────────────────────────────────────────────────────
(function exportToGlobal() {
  const g = globalThis as any;
  Object.assign(g, {
    queueWorker,
  });
})();
