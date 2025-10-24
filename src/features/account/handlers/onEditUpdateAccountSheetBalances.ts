// src/features/account/handlers/onEditRecalcBalances.ts

import { FastLog } from "@logging/FastLog";
import { setupWorkflows } from "@workflow";
import { startWorkflow } from "@workflow/workflowEngine";

type SheetsOnEdit = GoogleAppsScript.Events.SheetsOnEdit;

/**
 * Synchronous, range-aware recalculation for account sheets.
 * Recomputes running balances starting at the top-most edited row.
 */
export function onEditUpdateAccountSheetBalances(e: SheetsOnEdit): void {
  FastLog.log("updateAccountSheetBalances hit on", e.range.getA1Notation());
  if (!isSingleCellActuallyChanged(e)) return;

  try {
    const r = e.range;
    setupWorkflows();
    startWorkflow(
      "updateAccountSheetBalancesFlow",
      "updateAccountSheetBalancesStep1",
      {
        sheetName: r.getSheet().getName(),
        row: r.getRow(),
        startedBy: "updateAccountSheetBalances",
      }
    );
  } catch (err) {
    FastLog.error("updateAccountSheetBalances error", err);
  }
}

function isSingleCellActuallyChanged(e: SheetsOnEdit): boolean {
  if (!isSingleCell(e.range)) return false;
  const normalize = (s: string | undefined) => {
    if (s == null) return "";
    const t = s.trim();
    const n = Number(t.replace(/,/g, ""));
    if (!Number.isNaN(n) && t !== "") return String(n);
    return t;
  };
  return normalize(e.value) !== normalize(e.oldValue);
}

function isSingleCell(range: GoogleAppsScript.Spreadsheet.Range): boolean {
  return range.getNumRows() === 1 && range.getNumColumns() === 1;
}
