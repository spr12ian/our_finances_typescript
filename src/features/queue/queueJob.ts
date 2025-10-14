// queueJob.ts

// ───────────────────────────────────────────────────────────────────────────────
// Constants & schema
// ───────────────────────────────────────────────────────────────────────────────
import { THREE_SECONDS } from "@lib/timeConstants";
import { FastLog } from "@logging";
import { DEFAULT_PRIORITY, QUEUE_SHEET_NAME, STATUS } from "./queueConstants";
import type { QueueEnqueueOptions, JobRow } from "./queueTypes";

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
    // avoid re-entrancy during row allocation
    throw new Error("queueJob: Queue is busy; try again shortly.");
  }

  const fn = queueJob.name;
  const startTime = FastLog.start(fn, {
    parameters,
    options,
  });
  try {
    const priority =
      typeof options?.priority === "number"
        ? options!.priority
        : DEFAULT_PRIORITY;

    const id = generateId_();
    const dateNow = new Date();
    FastLog.log(fn, `Enqueuing job id=${id} at ${dateNow} (${dateNow.toISOString()})`);
    // Normalize: Date -> Date; null/undefined/anything else -> ""
    const runAtCell: Date | "" =
      options.runAt instanceof Date && !isNaN(options.runAt.getTime())
        ? options.runAt
        : "";

    const rowValues: JobRow = [
      id,
      JSON.stringify(parameters ?? {}),
      dateNow,
      priority,
      runAtCell,
      0,
      STATUS.PENDING,
      "",
      "",
      "",
    ];

    const sheet = getQueueSheet_();

    // Determine the row BEFORE writing and write atomically
    const rowIndex = sheet.getLastRow() + 1;
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);

    return { id, row: rowIndex };
  } catch (err) {
    FastLog.error(fn, err);
    throw err;
  } finally {
    try {
      lock.releaseLock();
    } catch (_e) {}

    try {
      FastLog.finish(fn, startTime);
    } catch {}
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
