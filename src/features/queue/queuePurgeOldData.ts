// queuePurgeOldData.ts

import { Sheet } from "@domain/Sheet";
import { DateHelper } from "@lib/DateHelper";
import { ONE_DAY_MS } from "@lib/timeConstants";
import { getDeadSheet } from "./getDeadSheet";
import { getQueueSheet } from "./getQueueSheet";
import {
  COLUMNS,
  HEADERS,
  MOVE_AFTER_DAYS,
  PURGE_AFTER_DAYS,
  STATUS,
} from "./queueConstants";
import type { JobRow, JobStatus } from "./queueTypes";

export function queuePurgeOldData(): void {
  moveQueueData_();
  purgeDeadData_();
}

function moveQueueData_(): void {
  if (MOVE_AFTER_DAYS > 0) {
    const queueSheet = getQueueSheet();

    moveOlderThanDays_(queueSheet, MOVE_AFTER_DAYS);
  }
}

function purgeDeadData_(): void {
  if (PURGE_AFTER_DAYS > 0) {
    const deadSheet = getDeadSheet();

    purgeQueueOlderThanDays_(deadSheet, PURGE_AFTER_DAYS);
  }
}

/**
 * Move DONE/ERROR jobs older than N days from the live queue sheet
 * to the DEAD sheet.
 *
 * Returns the number of rows moved.
 */
function moveOlderThanDays_(
  sheet: Sheet,
  days: number = MOVE_AFTER_DAYS
): number {
  const gasSheet = sheet.raw;
  const lastRow = gasSheet.getLastRow();
  if (lastRow < 2) return 0; // headers only

  const dataRows = lastRow - 1; // number of data rows (row 2..lastRow)
  const dataRange = gasSheet.getRange(2, 1, dataRows, HEADERS.length);
  const data = dataRange.getValues() as JobRow[];

  const cutoffMs = Date.now() - days * ONE_DAY_MS;

  const keep: JobRow[] = [];
  const toMove: JobRow[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const status = String(row[COLUMNS.STATUS - 1]) as JobStatus;

    const enq = DateHelper.coerceCellToUtcDate(row[COLUMNS.QUEUED_AT - 1]);
    const isOldDoneOrError =
      (status === STATUS.DONE || status === STATUS.ERROR) &&
      (enq?.getTime() ?? 0) < cutoffMs;

    if (isOldDoneOrError) {
      toMove.push(row);
    } else {
      keep.push(row);
    }
  }

  // If we'd remove *all* non-frozen rows, keep one blank to satisfy Sheets
  if (keep.length === 0 && data.length > 0) {
    const blank: any[] = new Array(HEADERS.length).fill("");
    // Optional: set defaults, e.g. STATUS.PENDING
    keep.push(blank as JobRow);
  }

  // 1) Write the kept rows back to the queue sheet in a single call
  if (keep.length > 0) {
    const outRange = gasSheet.getRange(2, 1, keep.length, HEADERS.length);
    outRange.setValues(keep);
  }

  // 2) Clear and delete the trailing rows that we no longer need
  const rowsToRemove = data.length - keep.length;
  if (rowsToRemove > 0) {
    const remainderStart = 2 + keep.length;

    gasSheet
      .getRange(remainderStart, 1, rowsToRemove, HEADERS.length)
      .clearContent();

    if (typeof (sheet as any).deleteRows === "function") {
      (sheet as any).deleteRows(remainderStart, rowsToRemove);
    } else {
      for (let r = lastRow; r >= remainderStart; r--) {
        gasSheet.deleteRow(r);
      }
    }
  }

  // 3) Append the moved rows to the DEAD sheet (batched)
  if (toMove.length > 0) {
    const deadSheet = getDeadSheet();
    const deadGasSheet = deadSheet.raw;
    const deadLastRow = deadGasSheet.getLastRow();
    const destStartRow = deadLastRow + 1; // assumes headers already exist if you want them

    deadGasSheet
      .getRange(destStartRow, 1, toMove.length, HEADERS.length)
      .setValues(toMove);
  }

  return toMove.length;
}

/** Prune DONE/ERROR jobs older than N days (defaults to PURGE_AFTER_DAYS). */
function purgeQueueOlderThanDays_(
  sheet: Sheet,
  days: number = PURGE_AFTER_DAYS
): number {
  const gasSheet = sheet.raw;
  const lastRow = gasSheet.getLastRow();
  if (lastRow < 2) return 0; // headers only

  const dataRows = lastRow - 1; // number of data rows (row 2..lastRow)
  const dataRange = gasSheet.getRange(2, 1, dataRows, HEADERS.length);
  const data = dataRange.getValues() as JobRow[];

  const cutoffMs = Date.now() - days * ONE_DAY_MS;

  // Keep rows that are NOT (DONE/ERROR and older than cutoff)
  const keep: JobRow[] = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const status = String(row[COLUMNS.STATUS - 1]) as JobStatus;

    const enq = DateHelper.coerceCellToUtcDate(row[COLUMNS.QUEUED_AT - 1]);
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
    const outRange = gasSheet.getRange(2, 1, keep.length, HEADERS.length);
    outRange.setValues(keep);
  }

  // 2) If we have fewer rows than before, clear the remainder then delete in one go
  const rowsToRemove = data.length - keep.length;
  if (rowsToRemove > 0) {
    // Clear the remainder to avoid stale values during UI flashes
    const remainderStart = 2 + keep.length;
    gasSheet
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
        gasSheet.deleteRow(r);
      }
    }
  }

  return rowsToRemove;
}

// ───────────────────────────────────────────────────────────────────────────────
// Export entrypoints to global for triggers & manual runs
// ───────────────────────────────────────────────────────────────────────────────
(function exportToGlobal() {
  const g = globalThis as any;
  Object.assign(g, {
    queuePurgeOldData,
  });
})();
