// queueJob.ts

// ───────────────────────────────────────────────────────────────────────────────
// Imports & constants
// ───────────────────────────────────────────────────────────────────────────────
import { THREE_SECONDS } from "@lib/timeConstants";
import { FastLog } from "@logging";
import { DEFAULT_PRIORITY, QUEUE_SHEET_NAME, STATUS } from "./queueConstants";
import type { QueueEnqueueOptions, JobRow } from "./queueTypes";
import { DateHelper } from "@lib/DateHelper";

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/** Enqueue a job */
export function queueJob(
  parameters: unknown,
  options: QueueEnqueueOptions = {}
): { id: string; row: number } {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(THREE_SECONDS)) {
    throw new Error("queueJob: Queue is busy; try again shortly.");
  }

  const fn = queueJob.name;
  const startTime = FastLog.start(fn, { parameters, options });

  try {
    const priority =
      typeof options?.priority === "number" ? options.priority : DEFAULT_PRIORITY;

    const id = generateId_();

    // UTC-normalized enqueue time
    const enqueuedAt = new Date();
    const displayEnqueuedAt = DateHelper.formatForLog(enqueuedAt);

    // Optional runAt normalization
    const runAtCell: Date | "" =
      options.runAt instanceof Date && !isNaN(options.runAt.getTime())
        ? new Date(options.runAt.toISOString())
        : "";

    FastLog.log(fn, `Enqueuing job id=${id} at ${displayEnqueuedAt}`);

    const rowValues: JobRow = [
      id,                                 // A: id
      JSON.stringify(parameters ?? {}),   // B: payload
      enqueuedAt,                         // C: enqueued_at
      priority,                           // D: priority
      runAtCell,                          // E: run_at
      0,                                  // F: attempts
      STATUS.PENDING,                     // G: status
      "",                                 // H: started_at
      "",                                 // I: finished_at
      "",                                 // J: error
    ];

    const sheet = getQueueSheet_();
    const rowIndex = sheet.getLastRow() + 1;
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);

    // Apply human-readable date formats
    sheet.getRange(rowIndex, 3).setNumberFormat(DateHelper.DISPLAY_DATE_FORMAT);
    sheet.getRange(rowIndex, 5).setNumberFormat(DateHelper.DISPLAY_DATE_FORMAT);

    FastLog.log(fn, `Job ${id} successfully enqueued on row ${rowIndex}`);

    return { id, row: rowIndex };
  } catch (err) {
    FastLog.error(fn, err);
    throw err;
  } finally {
    try { lock.releaseLock(); } catch {}
    try { FastLog.finish(fn, startTime); } catch {}
  }
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

function generateId_(): string {
  return Utilities.getUuid();
}
