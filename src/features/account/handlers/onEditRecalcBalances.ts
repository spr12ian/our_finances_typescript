// src/features/account/handlers/onEditRecalcBalances.ts

import { FastLog } from "@logging/FastLog";
import { Spreadsheet } from "@domain";
import { AccountSheet } from "@sheets/classes/AccountSheet";

type SheetsOnEdit = GoogleAppsScript.Events.SheetsOnEdit;

/**
 * Synchronous, range-aware recalculation for account sheets.
 * Recomputes running balances starting at the top-most edited row.
 */
export function onEditRecalcBalances(e: SheetsOnEdit): void {
  try {
    const range = e.range;
    const gsSheet = range.getSheet();
    const sheetName = gsSheet.getName();

    // Only account sheets (names starting with "_")
    if (!sheetName.startsWith("_")) return;

    // Determine if the edit intersects C:D (Credit/Debit).
    // Columns: A=1, B=2, C=3, D=4
    const c1 = range.getColumn();
    const c2 = c1 + range.getNumColumns() - 1;
    const overlapsCD = !(c2 < 3 || c1 > 4);
    if (!overlapsCD) return;

    const r1 = range.getRow(); // start from first edited row

    FastLog.log(`[onEditRecalcBalances] ${sheetName} ${range.getA1Notation()} → start row ${r1}`);

    // Wrap native objects with your domain wrappers
    const ss = gsSheet.getParent();
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
