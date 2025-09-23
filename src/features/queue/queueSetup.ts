// @queue/queueSetup.ts
import { DISPLAY_DATE_FORMAT } from "@lib/dates";
import { COL, DEAD_SHEET_NAME, HEADERS, QUEUE_SHEET_NAME } from "./queueConstants";

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────
// Run once (e.g., in setup) to format the date columns:
// Adjust COL.* indexes to your header mapping.

export function ensureQueueDateFormats() {
  const sheetNames = [DEAD_SHEET_NAME, QUEUE_SHEET_NAME];
  for (const sheetName of sheetNames) {
    const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (sheet) {
      ensureQueueDateFormats_(sheet);
    }
  }
}

function ensureQueueDateFormats_(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
  sheet
    .getRange(2, COL.ENQUEUED_AT, sheet.getMaxRows(), 1)
    .setNumberFormat(DISPLAY_DATE_FORMAT);
  sheet
    .getRange(2, COL.NEXT_RUN_AT, sheet.getMaxRows(), 1)
    .setNumberFormat(DISPLAY_DATE_FORMAT);
  sheet
    .getRange(2, COL.STARTED_AT, sheet.getMaxRows(), 1)
    .setNumberFormat(DISPLAY_DATE_FORMAT);
}
/** Ensure queue & dead‑letter sheets, headers, and a minute worker trigger. */
export function queueSetup(): void {
  const ss = SpreadsheetApp.getActive();
  const ensureSheet = (name: string) =>
    ss.getSheetByName(name) || ss.insertSheet(name);

  const queueSheet = ensureSheet(QUEUE_SHEET_NAME);
  ensureHeaders_(queueSheet);
  queueSheet.hideSheet();

  const deadSheet = ensureSheet(DEAD_SHEET_NAME);
  ensureHeaders_(deadSheet);
  deadSheet.hideSheet();

  ensureWorkerTrigger_();
}
// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function ensureHeaders_(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  const existing = range.getValues()[0] as string[];
  const needs = HEADERS.some((h, i) => existing[i] !== h);
  if (needs) {
    range.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function ensureWorkerTrigger_(): void {
  const triggers = ScriptApp.getProjectTriggers();
  const existing = triggers.find(
    (t) => t.getHandlerFunction() === "queueWorker"
  );
  if (!existing) {
    ScriptApp.newTrigger("queueWorker").timeBased().everyMinutes(1).create();
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Export entrypoints to global for triggers & manual runs
// ───────────────────────────────────────────────────────────────────────────────
(function exportToGlobal() {
  const g = globalThis as any;
  Object.assign(g, {
    queueSetup,
  });
})();
