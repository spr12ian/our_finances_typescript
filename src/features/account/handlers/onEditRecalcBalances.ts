// src/features/account/handlers/onEditRecalcBalances.ts

import { FastLog } from "@logging/FastLog";
import { Spreadsheet } from "@domain";
import { AccountSheet } from "@sheets/classes/AccountSheet";
import { setupWorkflowsOnce } from '@workflow/setupWorkflowsOnce';
import { startWorkflow } from '@workflow/workflowEngine';

const MAX_SYNC_ROWS = 1300;

type SheetsOnEdit = GoogleAppsScript.Events.SheetsOnEdit;

/**
 * Synchronous, range-aware recalculation for account sheets.
 * Recomputes running balances starting at the top-most edited row.
 */
export function onEditRecalcBalances(e: SheetsOnEdit): void {
  const fn= onEditRecalcBalances.name;
  try {
    const range = e.range;
    const gasSheet = range.getSheet();
    const sheetName = gasSheet.getName();

    // Only account sheets (names starting with "_")
    if (!sheetName.startsWith("_")) return;

    // Determine if the edit intersects C:D (Credit/Debit).
    // Columns: A=1, B=2, C=3, D=4
    const c1 = range.getColumn();
    const c2 = c1 + range.getNumColumns() - 1;
    const overlapsCD = !(c2 < 3 || c1 > 4);
    if (!overlapsCD) return;

    const r1 = range.getRow(); // start from first edited row
    const lastRow = gasSheet.getLastRow();
    const len = Math.max(0, lastRow - r1 + 1);
    if (len === 0) return;

    FastLog.log(fn,`${sheetName} ${range.getA1Notation()} → start row ${r1}`);

    if (len > MAX_SYNC_ROWS) {
      FastLog.warn(fn,
        `${sheetName} ${range.getA1Notation()} ` +
          `→ len=${len} > ${MAX_SYNC_ROWS}, enqueueing async recalc`
      );

      // Hand off to your existing flow rather than doing it inline
      setupWorkflowsOnce();
      startWorkflow(
        "updateAccountSheetBalancesFlow",
        "updateAccountSheetBalancesStep1",
        {
          sheetName,
          row: r1,
          startedBy: "onEditRecalcBalances",
        }
      );
      return;
    }

    // Wrap native objects with your domain wrappers
    const ss = gasSheet.getParent();
    const spreadsheet = new Spreadsheet(ss);
    const sheet = spreadsheet.getSheet(sheetName);

    // Recalculate from r1 downward; AccountSheet will seed from previous row H
    const acct = new AccountSheet(sheet, spreadsheet);
    acct.updateAccountSheetBalances(r1);
  } catch (err) {
    // Defensive logging; never throw from onEdit
    FastLog.error(`[onEditRecalcBalances] ${String(err)}`);
  }
}
