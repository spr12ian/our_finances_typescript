// @onEdit.ts
import { FastLog } from "@lib/logging";
import { isProgrammaticEdit } from "@lib/programmaticEditGuard";
import { withScriptLock } from "@lib/withScriptLock";

const INTAKE_PREFIX = "q:intake:";
const INTAKE_INDEX_PROP = "INTAKE_INDEX_V1";
const INTAKE_TTL_SEC = 600; // 10 minutes
const INTAKE_MAX_KEYS = 500; // bound the index size

type IntakeEntry = {
  ts: number;
  tsIso: string;
  queuedBy: "onEdit";
  sheetId: number | null;
  row: number | null;
  col: number | null;
};

export function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
  if (!e) {
    FastLog.log("onEdit → No event object found");
    return;
  }
  if (isProgrammaticEdit()) {
    FastLog.log("onEdit → Skipping programmatic edit");
    return;
  }

  FastLog.logTime("onEdit → User edit detected");

  // Optional + defensive: may still block under contention, so catch.
  let sheetId: number | null = null;
  try {
    sheetId = e.range?.getSheet?.().getSheetId?.() ?? null;
  } catch {
    // If the doc is busy, continue without it.
  }

  const entry: IntakeEntry = {
    ts: Date.now(),
    tsIso: new Date().toISOString(),
    queuedBy: "onEdit",
    sheetId,
    row: e.range?.getRow?.() ?? null,
    col: e.range?.getColumn?.() ?? null,
  };

  intakeEnqueue_(entry); // fast cache + indexed key write

  // const gasSheet = e.range.getSheet();
  // FastLog.logTime("onEdit → after e.range.getSheet() call");

  // const name = gasSheet.getName();
  // FastLog.logTime(`onEdit → Sheet name: ${name}`);

  // const a1Notation = e.range.getA1Notation();
  // FastLog.logTime(`onEdit → user edit in ${name} ${a1Notation}`);
  // your user-handling logic here...
}

// ── tiny helpers kept inside the IIFE ──────────────────────────────────────────
function getScriptCache_() {
  return CacheService.getScriptCache();
}

function getScriptProperties_() {
  return PropertiesService.getScriptProperties();
}

function intakeEnqueue_(entry: IntakeEntry): void {
  const key = INTAKE_PREFIX + Utilities.getUuid();
  getScriptCache_().put(key, JSON.stringify(entry), INTAKE_TTL_SEC);

  withScriptLock(
    () => {
      // Keep a compact index of keys so the worker can flush later.
      const raw = getScriptProperties_().getProperty(INTAKE_INDEX_PROP);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      arr.push(key);
      if (arr.length > INTAKE_MAX_KEYS) {
        arr.splice(0, arr.length - INTAKE_MAX_KEYS);
      }
      getScriptProperties_().setProperty(
        INTAKE_INDEX_PROP,
        JSON.stringify(arr)
      );
    },
    {
      timeoutMs: 50,
    }
  );
}
