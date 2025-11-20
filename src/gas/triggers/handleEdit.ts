// @gas/triggers/handleEdit.ts

import { getTriggerEventSheet } from "@gas/getTriggerEventSheet";
import { getErrorMessage } from "@lib/errors";
import { isSheetInIgnoreList } from "@lib/isSheetInIgnoreList";
import { withDocumentLock } from "@lib/WithDocumentLock";
import { FastLog } from "@logging";
import { debouncedOnEditRecalcBalances } from "../../features/account/handlers/debouncedOnEditRecalcBalances";

/** Keep this lean and at top-level so it's initialized once */
const ON_EDIT_RULES: OnEditRule[] = [
  {
    sheet: /^_/,
    range: "C2:D",
    fn: debouncedOnEditRecalcBalances,
    note: "recalc balances when credit/debit changes (sync, range-aware)",
  },
  {
    sheet: /^_/,
    range: ["B2:B", "E2:E"],
    fn: toUpperCase,
    note: "convert B/E to uppercase",
  },
];

// Optional: stop after the first matching rule to avoid duplicate work.
const FIRST_MATCH_ONLY = true;

// === Optimisation helpers (pre-parse A1 to numeric bounds; integer intersections) ===
type Bounds = { r1: number; c1: number; r2: number; c2: number };
type CompiledRule = {
  sheet: string | RegExp;
  bounds: Bounds[];
  fn: (e: SheetsOnEdit) => void;
  note?: string;
};
let __COMPILED_RULES_OPT: CompiledRule[] | null = null;

// ─────────────────────────────────────────────────────────
// non-blocking lock + light preamble + tiny debounce
// ─────────────────────────────────────────────────────────
export function handleEdit(e: SheetsOnEdit): void {
  const fn = handleEdit.name;

  try {
    const gasSheet = getTriggerEventSheet(e);
    const sheetName = gasSheet.getName();
    if (isSheetInIgnoreList(sheetName, fn)) return;

    const range = e.range;
    FastLog.log(`handleEdit → Edit at ${range.getA1Notation()}`);

    // ── tiny per-cell debounce to suppress “write → re-trigger storm”
    const cache = CacheService.getDocumentCache();
    if (cache) {
      const debounceKey = `debounce:${range
        .getSheet()
        .getSheetId()}:${range.getRow()}:${range.getColumn()}`;
      if (cache.get(debounceKey)) {
        FastLog.log("handleEdit → Debounced rapid re-edit");
        return;
      } // recently handled: skip
      cache.put(debounceKey, "1", 1); // 1-second TTL
    }

    // Prefer early exits before any logging of large objects
    if (!isSingleCell(range)) {
      FastLog.log("handleEdit → Ignored non-single-cell edit");
      return;
    } // rules expect single cell
    if (
      "oldValue" in e &&
      normalizeForChangeCheck(e.value) === normalizeForChangeCheck(e.oldValue)
    ) {
      FastLog.log("handleEdit → No actual value change detected");
      return; // no value change
    }

    const { editBounds } = __getEventPartsOpt(e);

    // Avoid feedback loops with queue sheets
    if (sheetName === "_QUEUE" || sheetName === "_DEAD") {
      FastLog.log(`handleEdit → Ignored edit in special sheet: ${sheetName}`);
      return;
    }

    // Dispatch (pure computation—no locks yet)
    const rules = __compileRulesOpt().filter((r) =>
      typeof r.sheet === "string"
        ? r.sheet === sheetName
        : (r.sheet as RegExp).test(sheetName)
    );
    if (rules.length === 0) {
      FastLog.log(`handleEdit → No matching rules for sheet: ${sheetName}`);
      return;
    }

    for (const rule of rules) {
      let match = false;
      for (const b of rule.bounds) {
        if (__intersectsBoundsOpt(editBounds, b)) {
          match = true;
          break;
        }
      }
      if (!match) {
        FastLog.log(
          `handleEdit → Rule skipped due to range mismatch: ${
            rule.note || "unnamed rule"
          }`
        );
        continue;
      }

      try {
        FastLog.log(
          `handleEdit → Executing rule: ${rule.note || "unnamed rule"}`
        );

        // ⬇️ Acquire a short, non-blocking DocumentLock ONLY around the mutation.
        const run = withDocumentLock<void>(
          "handleEdit", // label in your logs
          () => rule.fn(e), // the actual work (may read/write the sheet)
          50 // 50ms tryLock → skip if busy
        );

        const ok = run(); // returns undefined if busy (we skip gracefully)
        if (ok === undefined) {
          FastLog.warn(
            `handleEdit: doc lock busy — skipped "${
              rule.note || "unnamed rule"
            }"`
          );
        }
      } catch (err) {
        FastLog.error("handleEdit rule error", getErrorMessage(err));
      }

      if (FIRST_MATCH_ONLY) {
        FastLog.log("handleEdit → Stopping after first matching rule");
        break;
      }
    }
  } catch (err) {
    FastLog.error(fn, getErrorMessage(err));
    // Do NOT rethrow in a trigger; just log.
  }
}

function __colToIndexOpt(col: string): number {
  let n = 0;
  const s = col.trim().toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    if (ch >= 65 && ch <= 90) n = n * 26 + (ch - 64);
  }
  return n;
}

function __parseA1ToBoundsOpt(a1: string): Bounds {
  const t = a1.replace(/\s+/g, "").toUpperCase();
  const cell = /^([A-Z]+)(\d+)$/;
  const rect = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/;
  const colBand = /^([A-Z]+):([A-Z]+)$/;
  const rowBand = /^(\d+):(\d+)$/;
  const openRight = /^([A-Z]+)(\d+):([A-Z]+)$/;
  const openBottom = /^([A-Z]+):([A-Z]+)(\d+)$/;
  const MAX = 9999999;
  let r1 = 1,
    c1 = 1,
    r2 = MAX,
    c2 = MAX;
  let m: RegExpMatchArray | null;
  if ((m = t.match(rect))) {
    c1 = __colToIndexOpt(m[1]);
    r1 = parseInt(m[2], 10);
    c2 = __colToIndexOpt(m[3]);
    r2 = parseInt(m[4], 10);
  } else if ((m = t.match(cell))) {
    c1 = c2 = __colToIndexOpt(m[1]);
    r1 = r2 = parseInt(m[2], 10);
  } else if ((m = t.match(colBand))) {
    c1 = __colToIndexOpt(m[1]);
    c2 = __colToIndexOpt(m[2]);
    r1 = 1;
    r2 = MAX;
  } else if ((m = t.match(rowBand))) {
    r1 = parseInt(m[1], 10);
    r2 = parseInt(m[2], 10);
    c1 = 1;
    c2 = MAX;
  } else if ((m = t.match(openRight))) {
    c1 = __colToIndexOpt(m[1]);
    r1 = parseInt(m[2], 10);
    c2 = __colToIndexOpt(m[3]);
    r2 = MAX;
  } else if ((m = t.match(openBottom))) {
    c1 = __colToIndexOpt(m[1]);
    r1 = 1;
    c2 = __colToIndexOpt(m[2]);
    r2 = parseInt(m[3], 10);
  }
  if (r2 < r1) [r1, r2] = [r2, r1];
  if (c2 < c1) [c1, c2] = [c2, c1];
  return { r1, c1, r2, c2 };
}

function __parseRangeListToBoundsOpt(range: string | string[]): Bounds[] {
  const parts: string[] = Array.isArray(range)
    ? range
    : String(range).split(",");
  const out: Bounds[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t) continue;
    out.push(__parseA1ToBoundsOpt(t));
  }
  return out;
}

function __intersectsBoundsOpt(a: Bounds, b: Bounds): boolean {
  return !(a.r2 < b.r1 || a.r1 > b.r2 || a.c2 < b.c1 || a.c1 > b.c2);
}

function __compileRulesOpt(): CompiledRule[] {
  if (__COMPILED_RULES_OPT) return __COMPILED_RULES_OPT;
  const compiled: CompiledRule[] = [];
  for (const rule of ON_EDIT_RULES as any) {
    compiled.push({
      sheet: rule.sheet,
      bounds: __parseRangeListToBoundsOpt(rule.range),
      fn: rule.fn,
      note: rule.note,
    });
  }
  __COMPILED_RULES_OPT = compiled;
  return __COMPILED_RULES_OPT;
}

function __getEventPartsOpt(e: SheetsOnEdit) {
  const range = e.range;
  const r1 = range.getRow();
  const c1 = range.getColumn();
  const r2 = r1 + range.getNumRows() - 1;
  const c2 = c1 + range.getNumColumns() - 1;
  const sheetName = range.getSheet().getName();
  return { sheetName, editBounds: { r1, c1, r2, c2 } as Bounds };
}

function isSingleCell(range: GoogleAppsScript.Spreadsheet.Range): boolean {
  return range.getNumRows() === 1 && range.getNumColumns() === 1;
}

// ── PATCHED: pulled out from isSingleCellActuallyChanged() so we can use it early
function normalizeForChangeCheck(s: string | undefined): string {
  if (s == null) return "";
  const t = s.trim();
  const n = Number(t.replace(/,/g, ""));
  if (!Number.isNaN(n) && t !== "") return String(n);
  return t;
}

/* ── Example handlers ───────────────────────────────────── */

function toUpperCase(e: SheetsOnEdit): void {
  const fn = toUpperCase.name;
  const startTime = FastLog.start(fn, e.range.getA1Notation());

  try {
    if (!isSingleCellActuallyChanged(e)) return;
    const range = e.range;
    const value = range.getValue();
    if (typeof value === "string" && value !== value.toUpperCase()) {
      range.setValue(value.toUpperCase());
    }
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, errorMessage);
    throw new Error(errorMessage);
  } finally {
    FastLog.finish(fn, startTime);
  }
}

function isSingleCellActuallyChanged(e: SheetsOnEdit): boolean {
  if (!isSingleCell(e.range)) {
    FastLog.log("isSingleCellActuallyChanged → Not a single cell");
    return false;
  }
  return (
    normalizeForChangeCheck(e.value) !== normalizeForChangeCheck(e.oldValue)
  );
}
