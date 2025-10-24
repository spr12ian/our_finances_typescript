// onSelectionChange.ts

import { ONE_SECOND } from "@lib/timeConstants";
import { withDocumentLock } from "@lib/WithDocumentLock";
import { setupWorkflows } from "@workflow";
import { startWorkflow } from "@workflow/workflowEngine";

export function onSelectionChange(e: any): void {
  const sheet = e?.range?.getSheet?.() ?? SpreadsheetApp.getActiveSheet();
  if (!sheet) return;

  const sheetName = sheet.getName();

  const cache = CacheService.getDocumentCache();
  if (!cache) return;

  // Ignore if same sheet as last time (simple debounce)
  const lastSheet = cache.get("lastSheetName");
  if (lastSheet === sheetName) return;

  cache.put("lastSheetName", sheetName, 20);

  // Per-sheet cooldown to avoid noisy re-enqueues
  const COOLDOWN_MS = 15 * ONE_SECOND;
  const coolKey = `fixSheetCooldown:${sheetName}`;
  const lastTs = Number(cache.get(coolKey) || 0);
  const now = Date.now();
  if (now - lastTs < COOLDOWN_MS) return;
  cache.put(coolKey, String(now), Math.ceil(COOLDOWN_MS / 1000) + 5);

  // Script-level init: safe outside document lock
  setupWorkflows();

  // Enqueue fixSheet under a short, non-blocking document lock
  const run = withDocumentLock<void>(
    "onSelectionChange.fixSheetEnqueue",
    () =>
      startWorkflow("fixSheetFlow", "fixSheetStep1", {
        sheetName,
        startedBy: "onSelectionChange",
      }),
    200 // tryLock timeout (ms). Skip if busy.
  );

  // Fire; if busy, run() returns undefined
  if (run() === undefined) {
    // FastLog.warn("onSelectionChange: doc lock busy — skipped enqueue");
  }
}
