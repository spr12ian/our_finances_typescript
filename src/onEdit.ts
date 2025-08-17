/// <reference types="google-apps-script" />

import { FastLog } from './FastLog';
import { OurFinances } from './OurFinances';
import { Spreadsheet } from './Spreadsheet';

type SheetsOnEdit = GoogleAppsScript.Events.SheetsOnEdit;

type OnEditRule = {
  /** Sheet name to match, or a regex like /^_/ */
  sheet: string | RegExp;
  /** A1 notation for the watched region on that sheet (e.g. "C:C", "B2:D", "A1:Z1000") */
  range: string | string[];
  /** Handler to invoke when the edited range intersects the watched range */
  fn: (e: SheetsOnEdit) => void;
};

/** Keep this lean and at top-level so it's initialized once */
const ON_EDIT_RULES: OnEditRule[] = [
  // examples:
  { sheet: /^_/, range: ["C:D", "H:H"], fn: updateBalanceValues }, // any sheet starting with "_" → watch column C
  { sheet: "Budget", range: "B2:D", fn: updateBudgetPreview }, // "Budget" sheet, 3-column band starting B2
  { sheet: "Categories", range: "A:A", fn: refreshCategoryMap },
];

// Optional: stop after the first matching rule to avoid duplicate work.
// Set to false if you want all matching rules to fire.
const FIRST_MATCH_ONLY = true;

export function onEdit(e: SheetsOnEdit): void {
  // Guard against non-edit triggers or missing range
  if (!e || !e.range) return;

  const editRange = e.range;
  const sheet = editRange.getSheet();
  const sheetName = sheet.getName();

  for (const rule of ON_EDIT_RULES) {
    if (!sheetMatches(rule.sheet, sheetName)) continue;

    const ranges = Array.isArray(rule.range) ? rule.range : [rule.range];
    // Build once per rule, then test each concrete Range
    const watchedRanges = sheet.getRangeList(ranges).getRanges();

    if (intersectsAny(editRange, watchedRanges)) {
      try {
        rule.fn(e);
      } catch (err) {
        // Keep errors local; don't let them break other rules
        FastLog.error(
          `onEdit rule failed (${describeRule(rule, sheetName)}):`,
          err
        );
      }
      if (FIRST_MATCH_ONLY) return;
    }
  }
}

/* ── Helpers ─────────────────────────────────────────────── */

function sheetMatches(target: string | RegExp, name: string): boolean {
  return typeof target === "string" ? target === name : target.test(name);
}

function intersectsAny(
  a: GoogleAppsScript.Spreadsheet.Range,
  list: GoogleAppsScript.Spreadsheet.Range[]
): boolean {
  for (const b of list) if (intersects(a, b)) return true;
  return false;
}

function intersects(
  a: GoogleAppsScript.Spreadsheet.Range,
  b: GoogleAppsScript.Spreadsheet.Range
): boolean {
  const aR1 = a.getRow();
  const aC1 = a.getColumn();
  const aR2 = aR1 + a.getNumRows() - 1;
  const aC2 = aC1 + a.getNumColumns() - 1;

  const bR1 = b.getRow();
  const bC1 = b.getColumn();
  const bR2 = bR1 + b.getNumRows() - 1;
  const bC2 = bC1 + b.getNumColumns() - 1;

  const rowsOverlap = aR1 <= bR2 && aR2 >= bR1;
  const colsOverlap = aC1 <= bC2 && aC2 >= bC1;
  return rowsOverlap && colsOverlap;
}

function describeRule(rule: OnEditRule, actualSheet: string): string {
  const sheetDesc =
    typeof rule.sheet === "string" ? rule.sheet : rule.sheet.toString();
  return `sheet=${sheetDesc} (actual=${actualSheet}) range=${rule.range}`;
}

/* ── Example handlers (replace with your real ones) ───────── */

function updateBalanceValues(e: SheetsOnEdit): void {
  // …your logic here (e.range is inside the watched region)
  // Minimal example:
  FastLog.log("updateBalanceValues hit on", e.range.getA1Notation());
  const spreadsheet = new Spreadsheet(e.source);
  new OurFinances(spreadsheet).updateBalanceValues();
}

function updateBudgetPreview(e: SheetsOnEdit): void {
  console.log("updateBudgetPreview hit on", e.range.getA1Notation());
}

function refreshCategoryMap(e: SheetsOnEdit): void {
  console.log("refreshCategoryMap hit on", e.range.getA1Notation());
}
