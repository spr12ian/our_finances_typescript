
import { ONE_SECOND } from '@lib/timeConstants';
import { setupWorkflows } from "@workflow";
import { startWorkflow } from "@workflow/workflowEngine";

export function onSelectionChange(e: any): void {
  const sheet = e?.range?.getSheet() ?? SpreadsheetApp.getActiveSheet();
  if (!sheet) return;

  const sheetName = sheet.getName();


  const cache = CacheService.getDocumentCache();
  if (!cache) return;

  // Ignore if same sheet as last time (simple debounce)
  const lastSheet = cache.get("lastSheetName");
  if (lastSheet === sheetName) return;

  // Debounce + per-sheet cooldown
  cache.put("lastSheetName", sheetName, 20); // small debounce
  const COOLDOWN_MS = 15 * ONE_SECOND;
  const coolKey = `fixSheetCooldown:${sheetName}`;
  const lastTs = Number(cache.get(coolKey) || 0);
  const now = Date.now();
  if (now - lastTs < COOLDOWN_MS) return;
  cache.put(coolKey, String(now), Math.ceil(COOLDOWN_MS / 1000) + 5);

  // Light lock to avoid duplicate enqueues
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(200)) return;
  try {
    setupWorkflows(); // safe to call repeatedly (your code guards internally)
    startWorkflow("fixSheetFlow", "fixSheetStep1", {
      sheetName,
      startedBy: "onSelectionChange",
    });
  } finally {
    lock.releaseLock();
  }
}
