// queueJob.ts

// ───────────────────────────────────────────────────────────────────────────────
// Imports & constants
// ───────────────────────────────────────────────────────────────────────────────
import { DateHelper } from "@lib/DateHelper";
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { withDocumentLock } from "@lib/WithDocumentLock";
import { FastLog } from "@logging";
import { DEFAULT_PRIORITY, QUEUE_SHEET_NAME, STATUS } from "./queueConstants";
import type { JobRow, QueueEnqueueOptions } from "./queueTypes";

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/** Enqueue a job */

export function queueJob(
  parameters: unknown,
  options: QueueEnqueueOptions = {}
): { id: string; row: number } | undefined {
  // withDocumentLock returns a function → call it
  return withDocumentLock<{ id: string; row: number }>(
    "queueJob",
    () => doQueueJob(parameters, options),
    3 * ONE_SECOND_MS
  )();
}

// Small bounded retry with backoff; never returns undefined
export function queueJobMust(
  parameters: unknown,
  options: QueueEnqueueOptions = {}
): { id: string; row: number } {
  // 1) a few fast attempts (non-blocking)
  for (let i = 0; i < 3; i++) {
    const r = queueJob(parameters, options); // ← your soft version (T | undefined)
    if (r) return r;
    Utilities.sleep(100); // 100 ms
  }

  // 2) last chance: run the critical section with a longer lock timeout
  const attempt = withDocumentLock<{ id: string; row: number }>(
    "queueJobMust",
    () => doQueueJob(parameters, options), // call the inner implementation
    2 * ONE_SECOND_MS
  )();

  if (attempt) return attempt;

  // 3) If still nothing, log and throw: the engine *requires* a definitive id/row
  FastLog.error("queueJobMust", "Exhausted retries; queue is still busy.");
  throw new Error("queueJobMust: queue busy after retries");
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function generateId_(): string {
  return Utilities.getUuid();
}

function getQueueSheet_(): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(QUEUE_SHEET_NAME);
  if (!sheet) throw new Error("Queue sheet missing. Run queueSetup().");
  return sheet;
}

function doQueueJob(
  parameters: unknown,
  options: QueueEnqueueOptions = {}
): { id: string; row: number } {
  const functionName = queueJob.name;

  const startTime = FastLog.start(functionName, { parameters, options });

  try {
    const priority =
      typeof options?.priority === "number"
        ? options.priority
        : DEFAULT_PRIORITY;

    const id = generateId_();

    // UTC-normalized enqueue time
    const enqueuedAt = new Date();
    const displayEnqueuedAt = DateHelper.formatForLog(enqueuedAt);

    // Optional runAt normalization
    const runAtCell: Date | "" =
      options.runAt instanceof Date && !isNaN(options.runAt.getTime())
        ? new Date(options.runAt.toISOString())
        : "";

    FastLog.log(functionName, `Enqueuing job id=${id} at ${displayEnqueuedAt}`);

    const rowValues: JobRow = [
      id, // A: id
      JSON.stringify(parameters ?? {}), // B: payload
      enqueuedAt, // C: enqueued_at
      priority, // D: priority
      runAtCell, // E: run_at
      0, // F: attempts
      STATUS.PENDING, // G: status
      "", // H: started_at
      "", // I: finished_at
      "", // J: error
    ];

    const sheet = getQueueSheet_();
    const rowIndex = sheet.getLastRow() + 1;
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);

    // Apply human-readable date formats
    sheet.getRange(rowIndex, 3).setNumberFormat(DateHelper.DISPLAY_DATE_FORMAT);
    sheet.getRange(rowIndex, 5).setNumberFormat(DateHelper.DISPLAY_DATE_FORMAT);

    FastLog.log(
      functionName,
      `Job ${id} successfully enqueued on row ${rowIndex}`
    );

    return { id, row: rowIndex };
  } catch (err) {
    FastLog.error(functionName, err);
    throw err;
  } finally {
    try {
    } catch {}
    try {
      FastLog.finish(functionName, startTime);
    } catch {}
  }
}
