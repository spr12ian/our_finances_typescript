/// <reference types="google-apps-script" />

import { TWO_SECONDS } from "./constants";
import { FastLog } from "./FastLog";
import { OurFinances } from "./OurFinances";
import { Spreadsheet } from "./Spreadsheet";
import { withReentryGuard } from "./withReentryGuard";

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
  { sheet: /^_/, range: ["C:D", "H:H"], fn: updateBalanceValues }, // account sheets → watch column C, D, & H
  { sheet: "Budget", range: "B2:D", fn: updateBudgetPreview }, // "Budget" sheet, 3-column band starting B2
  { sheet: "Categories", range: "A:A", fn: refreshCategoryMap },
];

// Optional: stop after the first matching rule to avoid duplicate work.
// Set to false if you want all matching rules to fire.
const FIRST_MATCH_ONLY = true;

export function handleEdit(e: SheetsOnEdit): void {
  const kind = e?.triggerUid ? "installable" : e ? "simple" : "manual";
  console.log(`onEdit kind=${kind}`, { triggerUid: e?.triggerUid });
  if (kind !== "installable") return;

  const eventParts: any = brief(e);
  // 1) First-breath log (nothing slow above this line!)
  console.log("handleOnEdit ENTER", new Date().toISOString(), eventParts);

  try {
    // Guard against non-edit triggers or missing range
    if (!e || !e.range) return;

    const editRange = e.range;
    const a1 = editRange.getA1Notation();
    const gasSheet = editRange.getSheet();
    const sheetName = gasSheet.getName();
    FastLog.info(`onEdit: ${sheetName} ${a1}`);

    let fired = false;

    for (const rule of ON_EDIT_RULES) {
      if (!sheetMatches(rule.sheet, sheetName)) continue;

      const ranges = Array.isArray(rule.range) ? rule.range : [rule.range];
      // Build once per rule, then test each concrete Range
      const watched = gasSheet.getRangeList(ranges).getRanges();
      if (!intersectsAny(e.range, watched)) continue;

      fired = true;
      FastLog.info(`onEdit rule hit (${describeRule(rule, sheetName)}):`);

      withReentryGuard(
        `onEdit:${rule.fn.name}:${sheetName}`,
        TWO_SECONDS,
        () => {
          rule.fn(e);
        }
      );

      if (FIRST_MATCH_ONLY) break;
    }
    if (!fired) FastLog.info("onEdit: no rule matched");
  } catch (err) {
    FastLog.error("onEdit top-level error", err);
  } finally {
    FastLog.persistRing(); // <— always flush ring to properties
  }
}

/* ── Helpers ─────────────────────────────────────────────── */

function brief(e: SheetsOnEdit) {
  const range = e?.range;
  // Only log cheap, serializable fields
  return {
    range: range,
    sheetName: range && range.getSheet().getName(),
    a1Notation: range && range.getA1Notation(),
    col: range && range.getColumn(),
    row: range && range.getRow(),
    value: e?.value,
    oldValue: e?.oldValue,
  };
}

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
  FastLog.log("updateBalanceValues hit on", e.range.getA1Notation());
  if (!isSingleCellActuallyChanged(e)) {
    FastLog.log("Ignoring multi-cell edit or no actual change.");
    return;
  }
  const spreadsheet = new Spreadsheet(e.source);
  new OurFinances(spreadsheet).updateBalanceValues(e.range.getRow());
}

function updateBudgetPreview(e: SheetsOnEdit): void {
  console.log("updateBudgetPreview hit on", e.range.getA1Notation());
}

function refreshCategoryMap(e: SheetsOnEdit): void {
  console.log("refreshCategoryMap hit on", e.range.getA1Notation());
}

function isSingleCellActuallyChanged(e: SheetsOnEdit): boolean {
  const isSingleCell =
    e.range.getNumRows() === 1 && e.range.getNumColumns() === 1;
  if (!isSingleCell) return false; // ignore multi-cell edits

  const normalize = (s: string | undefined) => {
    if (s == null) return ""; // treat undefined as empty (clears)
    const t = s.trim();
    // normalize numbers like "1.0" vs "1"
    const n = Number(t.replace(/,/g, ""));
    if (!Number.isNaN(n) && t !== "") return String(n);
    return t;
  };

  const v = normalize(e.value);
  const ov = normalize(e.oldValue);
  const actuallyChanged = v !== ov;

  return actuallyChanged;
  // … proceed with your logic
}
