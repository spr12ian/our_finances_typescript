// src/gas/triggers/handleOpen.ts

import { getTriggerEventSheet } from "@gas/getTriggerEventSheet";
import { isSheetInIgnoreList } from "@lib/isSheetInIgnoreList";
import { FastLog } from "@logging/FastLog";
import { withLog } from "@logging/WithLog";
import { setupWorkflowsOnce } from "@workflow";
import { isEngineConfigured } from "@workflow/engineState";
import { queueWorkflow } from "@workflow/queueWorkflow";

type SheetsOnOpen = GoogleAppsScript.Events.SheetsOnOpen;

// ---------------------------
// Public entry point
// ---------------------------
export function handleOpen(e: SheetsOnOpen): void {
  const fn = handleOpen.name;
  const gasSheet = getTriggerEventSheet(e);
  const sheetName = gasSheet.getName();
  if (isSheetInIgnoreList(sheetName, fn)) return;

  const ready = setupWorkflowsOnce(); // returns true/false in your impl
  if (!ready || !isEngineConfigured()) {
    FastLog.warn(fn, "Engine not ready; skipping open-time workflows");
    return;
  }

  withLog(queueWorkflow)("fixSheetFlow", "fixSheetStep1", {
    sheetName: sheetName,
  }, { queuedBy: fn });
}
