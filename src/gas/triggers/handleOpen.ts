/// <reference types="google-apps-script" />

import * as queueConstants from "../../features/queue/queueConstants";
import { startWorkflow } from "../../features/workflow/workflowEngine";
import { FastLog } from "../../lib/logging/FastLog";

type SheetsOnOpen = GoogleAppsScript.Events.SheetsOnOpen;

// ---------------------------
// Public entry point
// ---------------------------
export function handleOpen(e: SheetsOnOpen): void {
  const startTime = FastLog.start(handleOpen.name, e);

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
    FastLog.error(handleOpen.name, err);
    throw err;
  } finally {
    try {
      FastLog.finish(handleOpen.name, startTime);
    } catch {}
  }
}
