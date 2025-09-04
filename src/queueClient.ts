/// <reference types="google-apps-script" />

// ───────────────────────────────────────────────────────────────────────────────
// Constants & schema
// ───────────────────────────────────────────────────────────────────────────────
import { toIso_ } from "./DateFunctions";
import * as queueConstants from "./queueConstants";
import type { EnqueueOptions, JobName, JobRow } from "./queueTypes";


// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/** Enqueue a job */
export function queue_enqueue<Name extends JobName = JobName>(
  job_name: Name,
  parameters: unknown,
  options: EnqueueOptions = {}
): { id: string; row: number } {
  const priority =
    typeof options?.priority === "number"
      ? options!.priority
      : queueConstants.DEFAULT_PRIORITY;

  const sheet = getQueueSheet_();

  const id = generateId_();
  const row: JobRow = [
    id,
    String(job_name) as any,
    JSON.stringify(parameters ?? {}),
    toIso_(new Date()),
    priority,
    toIso_(options.runAt),
    0,
    queueConstants.STATUS.PENDING,
    "",
    "",
    "",
  ];

  sheet.appendRow(row);

  return { id, row: sheet.getLastRow() };
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

function generateId_(): string {
  return Utilities.getUuid();
}
