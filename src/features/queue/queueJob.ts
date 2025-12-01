// queueJob.ts

// ───────────────────────────────────────────────────────────────────────────────
// Imports & constants
// ───────────────────────────────────────────────────────────────────────────────
import { DateHelper } from "@lib/DateHelper";
import { ONE_SECOND_MS } from "@lib/timeConstants";
import { withDocumentLock } from "@lib/WithDocumentLock";
import { FastLog, withLog } from "@logging";
import type { SerializedRunStepParameters } from "@workflow/workflowTypes";
import { getQueueSheet } from "./getQueueSheet";
import { COLUMNS, DEFAULT_PRIORITY, STATUS } from "./queueConstants";
import type { JobRow, QueueEnqueueOptions } from "./queueTypes";

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/** Enqueue a job */

// Small bounded retry with backoff; never returns undefined
export function queueJob(
  runStepParameters: SerializedRunStepParameters,
  options: QueueEnqueueOptions = {}
): { id: string; row: number } {
  const fn = queueJob.name;
  // 1) a few fast attempts (non-blocking)
  for (let i = 0; i < 3; i++) {
    const r = withLog(tryQueueJob)(runStepParameters, options); // ← your soft version (T | undefined)
    if (r) return r;
    Utilities.sleep(100); // 100 ms
  }

  // 2) last chance: run the critical section with a longer lock timeout
  const attempt = withDocumentLock<{ id: string; row: number }>(
    () => withLog(doQueueJob)(runStepParameters, options), // call the inner implementation
    2 * ONE_SECOND_MS
  )();

  if (attempt) return attempt;

  // 3) If still nothing, log and throw: the engine *requires* a definitive id/row
  FastLog.error(fn, "Exhausted retries; queue is still busy.");
  throw new Error(`${fn}: queue busy after retries`);
}

export function tryQueueJob(
  parameters: SerializedRunStepParameters,
  options: QueueEnqueueOptions = {}
): { id: string; row: number } | undefined {
  // withDocumentLock returns a function → call it
  return withDocumentLock<{ id: string; row: number }>(
    () => withLog(doQueueJob)(parameters, options),
    3 * ONE_SECOND_MS
  )();
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function generateId_(): string {
  return Utilities.getUuid();
}

function doQueueJob(
  payload: SerializedRunStepParameters,
  options: QueueEnqueueOptions = {}
): { id: string; row: number } {
  const fn = doQueueJob.name;

  FastLog.log(fn, {
    parameters: payload,
    options,
  });

  const priority =
    typeof options?.priority === "number" ? options.priority : DEFAULT_PRIORITY;

  const id = generateId_();

  // UTC-normalized enqueue time
  const queuedAt = new Date();
  const displayEnqueuedAt = DateHelper.formatForLog(queuedAt);

  // Optional runAt normalization
  const runAtCell: Date | "" =
    options.runAt instanceof Date && !isNaN(options.runAt.getTime())
      ? new Date(options.runAt.toISOString())
      : "";

  FastLog.log(fn, `Queuing job id=${id} at ${displayEnqueuedAt}`);

  const { queuedBy } = options;
  FastLog.log(fn, { queuedBy: queuedBy });

  const rowValues: JobRow = [
    id, // A: id
    queuedAt, // B: queued_at
    queuedBy ?? "", // C: queued_by
    JSON.stringify(payload ?? {}), // D: payload
    priority, // E: priority
    runAtCell, // F: run_at
    0, // G: attempts
    STATUS.PENDING, // H: status
    "", // I: started_at
    "", // J: finished_at
    "", // K: error
  ];
  FastLog.log(fn, `rowValues: ${rowValues}`);

  const sheet = getQueueSheet();
  const gasSheet = sheet.raw;
  const rowIndex = gasSheet.getLastRow() + 1;
  gasSheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);

  // Apply human-readable date formats
  gasSheet
    .getRange(rowIndex, COLUMNS.QUEUED_AT)
    .setNumberFormat(DateHelper.DISPLAY_DATE_FORMAT);
  gasSheet
    .getRange(rowIndex, COLUMNS.NEXT_RUN_AT)
    .setNumberFormat(DateHelper.DISPLAY_DATE_FORMAT);
  gasSheet
    .getRange(rowIndex, COLUMNS.STARTED_AT)
    .setNumberFormat(DateHelper.DISPLAY_DATE_FORMAT);

  FastLog.log(fn, `Job ${id} successfully enqueued on row ${rowIndex}`);

  return { id, row: rowIndex };
}
