/// <reference types="google-apps-script" />

import * as queueConstants from "./queueConstants";
import { queueJob } from "./queueJob";
import { FastLog } from "./support/FastLog";

type SheetsOnOpen = GoogleAppsScript.Events.SheetsOnOpen;

// ---------------------------
// Public entry point
// ---------------------------
export function handleOpenTrigger(e: SheetsOnOpen): void {
  const startTime = FastLog.start(handleOpenTrigger.name, e);

  try {
    if (!e || !e.source || !e.source.getActiveSheet()) return;

    const sheetName = e.source.getActiveSheet().getName();
    if (
      sheetName === queueConstants.QUEUE_SHEET_NAME ||
      sheetName === queueConstants.DEAD_SHEET_NAME
    )
      return; // avoid feedback loops

    queueFixSheet(e);
  } catch (err) {
    FastLog.error(handleOpenTrigger.name, err);
    throw err;
  } finally {
    try {
      FastLog.finish(handleOpenTrigger.name, startTime);
    } catch {}
  }
}

/* ── Example handlers ───────────────────────────────────── */

function queueFixSheet(e: SheetsOnOpen): void {
  const startTime = FastLog.start(queueFixSheet.name, e);

  try {
    const parameters = {
      sheetName: e.source.getActiveSheet().getName(),
    };
    queueJob("FIX_SHEET", parameters, { priority: 80 });
  } catch (err) {
    FastLog.error(queueFixSheet.name, err);
  } finally {
    try {
      FastLog.finish(queueFixSheet.name, startTime);
    } catch {}
  }
}
