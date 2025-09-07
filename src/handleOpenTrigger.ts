/// <reference types="google-apps-script" />

import * as queueConstants from "./queueConstants";
import { queueJob } from "./queueJob";
import { FastLog } from "./support/FastLog";

type SheetsOnOpen = GoogleAppsScript.Events.SheetsOnOpen;

// ---------------------------
// Public entry point
// ---------------------------
export function handleOpenTrigger(e: SheetsOnOpen): void {
  const startMs = Date.now();
  FastLog.info(`handleOpenTrigger started`);

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
    FastLog.error(`handleOpenTrigger error: ${(err as Error)?.message || err}`);
    throw err;
  } finally {
    FastLog.info(
      `handleOpenTrigger ran for ${Date.now() - startMs}ms`
    );
  }
}

/* ── Example handlers ───────────────────────────────────── */

function queueFixSheet(e: SheetsOnOpen): void {
  FastLog.log("Started queueFixSheet");

  try {
    const parameters = {
      sheetName: e.source.getActiveSheet().getName(),
    };
    queueJob(queueConstants.FUNCTION_CALLED.FIX_SHEET, parameters, {
      priority: 80,
    });
  } catch (err) {
    FastLog.error("queueFixSheet error", err);
  }
}
