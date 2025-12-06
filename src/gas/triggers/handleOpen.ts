// src/gas/triggers/handleOpen.ts

import { getTriggerEventSheet } from "@gas/getTriggerEventSheet";
import { isSheetInIgnoreList } from "@lib/isSheetInIgnoreList";
import { setupWorkflowsOnce } from "@workflow";
import { enqueueFixSheetFlow } from "@workflow/enqueueFixSheetFlow";

type SheetsOnOpen = GoogleAppsScript.Events.SheetsOnOpen;

// ---------------------------
// Public entry point
// ---------------------------
export function handleOpen(e: SheetsOnOpen): void {
  const fn = handleOpen.name;
  const gasSheet = getTriggerEventSheet(e);
  const sheetName = gasSheet.getName();
  if (isSheetInIgnoreList(sheetName, fn)) return;

  queueFixSheet_(sheetName, fn);
}

function queueFixSheet_(sheetName: string, fn: string) {
  setupWorkflowsOnce();

  enqueueFixSheetFlow(sheetName, fn);
}
