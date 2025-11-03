// src/gas/triggers/handleOpen.ts

import { FastLog } from "@logging/FastLog";
import * as queueConstants from "@queue/queueConstants";
import { setupWorkflowsOnce } from "@workflow";
import { isEngineConfigured, startWorkflow } from "@workflow/workflowEngine";

type SheetsOnOpen = GoogleAppsScript.Events.SheetsOnOpen;

// ---------------------------
// Public entry point
// ---------------------------
export function handleOpen(e: SheetsOnOpen): void {
  setupWorkflowsOnce();

  try {
    if (!e || !e.source || !e.source.getActiveSheet()) return;

    const sheetName = e.source.getActiveSheet().getName();
    if (
      sheetName === queueConstants.QUEUE_SHEET_NAME ||
      sheetName === queueConstants.DEAD_SHEET_NAME
    )
      return; // avoid feedback loops

    const ready = setupWorkflowsOnce(); // returns true/false in your impl
    if (!ready || !isEngineConfigured()) {
      FastLog.warn(
        "handleOpen: engine not ready; skipping open-time workflows"
      );
      return;
    }

    startWorkflow("fixSheetFlow", "fixSheetStep1", {
      sheetName: sheetName,
      startedBy: "onOpen",
    });
  } catch (err) {
    FastLog.error(handleOpen.name, err);
    throw err;
  }
}
