// @workflow/flows/fixSheet/enqueueFixSheetFlow.ts

import type { SheetNameT } from "@domain";
import { withLog } from "@logging";
import { queueWorkflow } from "@workflow/queueWorkflow";

export function enqueueFixSheetFlow(
  sheetName: SheetNameT,
  queuedBy: string,
  options?: { priority?: number }
) {
  const { priority } = options ?? {};
  return withLog(queueWorkflow)(
    "fixSheetFlow",
    "fixSheetStep01",
    { sheetName },
    { queuedBy, priority }
  );
}
