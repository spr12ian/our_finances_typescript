// src/features/account/handlers/onEditRecalcBalances.ts

import { Spreadsheet } from "@domain";
import { FastLog } from "@logging/FastLog";
import { withLog } from "@logging/WithLog";
import { AccountSheet } from "@sheets/classes/AccountSheet";
import { setupWorkflowsOnce } from "@workflow/setupWorkflowsOnce";
import { startWorkflow } from "@workflow/workflowEngine";

export const MAX_SYNC_ROWS = 1300;

export type SheetsOnEdit = GoogleAppsScript.Events.SheetsOnEdit;

/**
 * Synchronous, range-aware recalculation for account sheets.
 * Recomputes running balances starting at the top-most edited row,
 * coalescing multiple edits within a short window.
 */
export function onEditRecalcBalances(e: SheetsOnEdit): void {
  const fn = onEditRecalcBalances.name;

  try {
    const range = e.range;
    const gasSheet = range.getSheet();
    const sheetName = gasSheet.getName();

    // Only account sheets (names starting with "_")
    if (!sheetName.startsWith("_")) return;

    // Determine if the edit intersects C:D (Credit/Debit).
    const c1 = range.getColumn();
    const c2 = c1 + range.getNumColumns() - 1;
    const overlapsCD = !(c2 < 3 || c1 > 4);
    if (!overlapsCD) return;

    const lastRow = gasSheet.getLastRow();
    if (lastRow < 2) return; // nothing to do

    const editRow = range.getRow();

    // ─────────────────────────────────────────────
    // Coalesce multiple edits → track earliest row
    // ─────────────────────────────────────────────
    const cache = CacheService.getDocumentCache();
    let startRow = editRow;

    if (cache) {
      const key = `balances:minRow:${sheetName}`;
      const previous = cache.get(key);
      if (previous) {
        const prevRow = Number(previous);
        if (!Number.isNaN(prevRow) && prevRow > 0) {
          startRow = Math.min(startRow, prevRow);
        }
      }
      // Keep the earliest row alive for a short window (e.g. 30s)
      cache.put(key, String(startRow), 30);
    }

    const len = Math.max(0, lastRow - startRow + 1);
    if (len === 0) return;

    FastLog.log(
      fn,
      `${sheetName} ${range.getA1Notation()} → start row ${startRow}, len=${len}`
    );

    if (len > MAX_SYNC_ROWS) {
      FastLog.warn(
        fn,
        `${sheetName} ${range.getA1Notation()} → len=${len} > ${MAX_SYNC_ROWS}, enqueueing async recalc`
      );

      // Hand off to your workflow instead of doing heavy work inline
      setupWorkflowsOnce();
      withLog(fn, startWorkflow)(
        "updateAccountSheetBalancesFlow",
        "updateAccountSheetBalancesStep1",
        {
          sheetName,
          row: startRow,
          queuedBy: "onEditRecalcBalances",
        }
      );
      return;
    }

    // ─────────────────────────────────────────────
    // Synchronous small recalculation
    // ─────────────────────────────────────────────
    const ss = gasSheet.getParent();
    const spreadsheet = new Spreadsheet(ss);
    const sheet = spreadsheet.getSheet(sheetName);

    const acct = new AccountSheet(sheet, spreadsheet);
    acct.updateAccountSheetBalances(startRow);
  } catch (err) {
    FastLog.error(`[onEditRecalcBalances] ${String(err)}`);
    // Do NOT rethrow in a trigger
  }
}
