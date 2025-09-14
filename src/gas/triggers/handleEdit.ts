/// <reference types="google-apps-script" />

import { FastLog } from "../../lib/FastLog";
import * as queueConstants from "../../features/queue/queueConstants";
import { queueJob } from "../../features/queue/queueJob";

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
  { sheet: /^_/, range: "C2:D", fn: updateBalanceValues },
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

// ---------------------------
// Public entry point
// ---------------------------
export function handleEdit(e: SheetsOnEdit): void {
  const startMs = Date.now();
  FastLog.info(`handleEditTrigger started`);

  let fired = false;

  try {
    if (!e || !e.range || !isSingleCell(e.range)) return;

    const { sheetName, editBounds } = __getEventPartsOpt(e);
    if (
      sheetName === queueConstants.QUEUE_SHEET_NAME ||
      sheetName === queueConstants.DEAD_SHEET_NAME
    )
      return; // avoid feedback loops

    // Ultra-cheap early exits
    if (editBounds.r1 !== editBounds.r2 || editBounds.c1 !== editBounds.c2)
      return;
    // Old/new value equality (skip formula recalculate churn)
    if ("oldValue" in e && e.oldValue === e.value) return;

    const rules = __compileRulesOpt().filter((r) =>
      typeof r.sheet === "string"
        ? r.sheet === sheetName
        : (r.sheet as RegExp).test(sheetName)
    );
    if (rules.length === 0) return;

    // const cellKey = `${editBounds.r1}:${editBounds.c1}`;

    for (const rule of rules) {
      let match = false;
      for (const b of rule.bounds) {
        if (__intersectsBoundsOpt(editBounds, b)) {
          match = true;
          break;
        }
      }
      if (!match) continue;

      rule.fn(e);

      // FastLog.info(
      //   `handleEditTrigger rule match found on ${sheetName}:${cellKey}`
      // );

      // withReentryGuard(
      //   `handleEditTrigger:${sheetName}:${cellKey}`,
      //   TWO_SECONDS,
      //   () => {
      //     rule.fn(e);
      //   }
      // );

      fired = true;
      if (FIRST_MATCH_ONLY) break;
    }
  } catch (err) {
    fired = true;
    FastLog.error(`handleEditTrigger error: ${(err as Error)?.message || err}`);
    throw err;
  } finally {
    // if (fired) FastLog.persistRing();
    FastLog.info(
      `handleEditTrigger ran for ${Date.now() - startMs}ms, fired: ${fired}`
    );
  }
}

/* ── Example handlers ───────────────────────────────────── */

function updateBalanceValues(e: SheetsOnEdit): void {
  FastLog.log("updateBalanceValues hit on", e.range.getA1Notation());
  if (!isSingleCellActuallyChanged(e)) return;

  try {
    const r = e.range;
    const parameters = {
      sheetName: r.getSheet().getName(),
      row: r.getRow(),
    };
    queueJob(queueConstants.FUNCTION_CALLED.UPDATE_BALANCES, parameters, {
      priority: 80,
    });
  } catch (err) {
    FastLog.error("updateBalanceValues error", err);
  }
}

function isSingleCell(range: GoogleAppsScript.Spreadsheet.Range): boolean {
  return range.getNumRows() === 1 && range.getNumColumns() === 1;
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
