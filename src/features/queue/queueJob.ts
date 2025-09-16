// queueJob.ts

// ───────────────────────────────────────────────────────────────────────────────
// Constants & schema
// ───────────────────────────────────────────────────────────────────────────────
import { toIso_ } from "@lib/dates";
import { FastLog } from "@logging";
import { DEFAULT_PRIORITY, QUEUE_SHEET_NAME, STATUS } from "./queueConstants";
import type { EnqueueOptions, JobRow } from "./queueTypes";

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/** Enqueue a job */
export function queueJob(
  parameters: unknown,
  options: EnqueueOptions = {}
): { id: string; row: number } {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(3000)) {
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
    const isoNow = toIso_(new Date());
    const isoRunAt = toIso_(options.runAt);

    const rowValues: JobRow = [
      id,
      JSON.stringify(parameters ?? {}),
      isoNow,
      priority,
      isoRunAt,
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
