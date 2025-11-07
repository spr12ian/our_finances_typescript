// src/gas/triggers/handleOpen.ts

import { getTriggerEventSheet } from '@gas/getTriggerEventSheet';
import { getErrorMessage } from "@lib/errors";
import { isSheetInIgnoreList } from "@lib/isSheetInIgnoreList";
import { FastLog } from "@logging/FastLog";
import { setupWorkflowsOnce } from "@workflow";
import { isEngineConfigured } from "@workflow/engineState";
import { startWorkflow } from "@workflow/workflowEngine";

type SheetsOnOpen = GoogleAppsScript.Events.SheetsOnOpen;

// ---------------------------
// Public entry point
// ---------------------------
export function handleOpen(e: SheetsOnOpen): void {
  const fn = handleOpen.name;
  try {
    const gasSheet = getTriggerEventSheet(e);
    const sheetName = gasSheet.getName();
    if (isSheetInIgnoreList(sheetName, fn)) return;

    const ready = setupWorkflowsOnce(); // returns true/false in your impl
    if (!ready || !isEngineConfigured()) {
      FastLog.warn(fn, "Engine not ready; skipping open-time workflows");
      return;
    }

    startWorkflow("fixSheetFlow", "fixSheetStep1", {
      sheetName: sheetName,
      startedBy: "onOpen",
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, errorMessage);
    throw new Error(`${fn} failed: ${errorMessage}`);
  }
}
