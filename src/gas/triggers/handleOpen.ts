// src/gas/triggers/handleOpen.ts

import { FastLog } from "@logging/FastLog";
import { DEAD_SHEET_NAME, QUEUE_SHEET_NAME } from "@queue/queueConstants";
import { setupWorkflowsOnce } from "@workflow";
import { isEngineConfigured } from "@workflow/engineState";
import { startWorkflow } from "@workflow/workflowEngine";

const IGNORE_SHEETS = new Set([QUEUE_SHEET_NAME, DEAD_SHEET_NAME]);

type SheetsOnOpen = GoogleAppsScript.Events.SheetsOnOpen;

// ---------------------------
// Public entry point
// ---------------------------
export function handleOpen(e: SheetsOnOpen): void {
  try {
    if (!e || !e.source || !e.source.getActiveSheet()) {
      FastLog.warn(
        "handleOpen: no active sheet or missing event info; skipping open-time workflows"
      );
      return;
    }

    const sheetName = e.source.getActiveSheet().getName();
    if (IGNORE_SHEETS.has(sheetName)) {
      FastLog.info(
        `handleOpen: ignoring sheet "${sheetName}"; skipping open-time workflows`
      );
      return;
    }

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
