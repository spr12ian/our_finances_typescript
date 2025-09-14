/// <reference types="google-apps-script" />

// ───────────────────────────────────────────────────────────────────────────────
// Constants & schema
// ───────────────────────────────────────────────────────────────────────────────
import * as queueConstants from "./queueConstants";

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────
/** Ensure queue & dead‑letter sheets, headers, and a minute worker trigger. */
export function queue_ensureSetup(): void {
  const ss = SpreadsheetApp.getActive();
  const ensureSheet = (name: string) =>
    ss.getSheetByName(name) || ss.insertSheet(name);

  const queueSheet = ensureSheet(queueConstants.QUEUE_SHEET_NAME);
  ensureHeaders_(queueSheet);
  queueSheet.hideSheet();

  const deadSheet = ensureSheet(queueConstants.DEAD_SHEET_NAME);
  ensureHeaders_(deadSheet);
  deadSheet.hideSheet();

  ensureWorkerTrigger_();
}
// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function ensureHeaders_(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
  const range = sheet.getRange(1, 1, 1, queueConstants.HEADERS.length);
  const existing = range.getValues()[0] as string[];
  const needs = queueConstants.HEADERS.some((h, i) => existing[i] !== h);
  if (needs) {
    range.setValues([queueConstants.HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function ensureWorkerTrigger_(): void {
  const triggers = ScriptApp.getProjectTriggers();
  const existing = triggers.find(
    (t) => t.getHandlerFunction() === "queue_worker"
  );
  if (!existing) {
    ScriptApp.newTrigger("queue_worker").timeBased().everyMinutes(1).create();
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Export entrypoints to global for triggers & manual runs
// ───────────────────────────────────────────────────────────────────────────────
(function exportToGlobal() {
  const g = globalThis as any;
  Object.assign(g, {
    queue_ensureSetup,
  });
})();
