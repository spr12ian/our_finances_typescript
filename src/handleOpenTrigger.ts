/// <reference types="google-apps-script" />

import { startWorkflow } from "./app/workflow/workflowEngine";
import { FastLog } from "./lib/FastLog";
import * as queueConstants from "./queueConstants";

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

    // registerAllWorkflows();
    startWorkflow("onOpenFlow", "onOpenFixSheet", {
      sheetName: sheetName,
      startedBy: "onOpen",
    });
  } catch (err) {
    FastLog.error(handleOpenTrigger.name, err);
    throw err;
  } finally {
    try {
      FastLog.finish(handleOpenTrigger.name, startTime);
    } catch {}
  }
}
