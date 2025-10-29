// onSelectionChange.ts
import { idempotencyKey, tryClaimKey } from "@lib/idempotency";
import { ONE_SECOND } from "@lib/timeConstants";
import { withDocumentLock } from "@lib/WithDocumentLock";
import { setupWorkflowsOnce } from "@workflow";
import { startWorkflow } from "@workflow/workflowEngine";
import { shouldHandleSelection } from "@gas/shouldHandleSelection";

function shouldFixSheet(name: string): boolean {
  if (!name) return false;
  if (name.startsWith("_")) return false;
  if (name === "Status" || name === "Queue") return false;
  return true;
}

export function onSelectionChange(e: any): void {
  setupWorkflowsOnce();

  const sheet = e?.range?.getSheet?.() ?? SpreadsheetApp.getActiveSheet();
  if (!sheet) return;

  const sheetName = sheet.getName();
  if (!shouldFixSheet(sheetName)) return;

  if (!shouldHandleSelection(sheetName)) return;

  // --- per-user debounce (guard nullable type) ---
  const userCache = CacheService.getUserCache();
  if (!userCache) return; // types say nullable; bail safely

  const lastSheet = userCache.get("lastSheetName");
  if (lastSheet === sheetName) return;
  userCache.put("lastSheetName", sheetName, 20); // seconds

  // --- shared per-sheet cooldown (guard nullable type) ---
  const docCache = CacheService.getDocumentCache();
  if (!docCache) return; // guard to satisfy TS

  const COOLDOWN_MS = 15 * ONE_SECOND;
  const coolKey = `fixSheetCooldown:${sheetName}`;
  const lastTs = Number(docCache.get(coolKey) || 0);
  const now = Date.now();
  if (now - lastTs < COOLDOWN_MS) return;
  docCache.put(coolKey, String(now), Math.ceil(COOLDOWN_MS / 1000) + 5);

  // --- idempotency ---
  const wf = "fixSheetFlow";
  const step = "fixSheetStep1";
  const token = idempotencyKey(wf, step, sheetName);
  if (!tryClaimKey(token, 30)) return;

  // --- enqueue under short non-blocking lock ---
  withDocumentLock(
    "onSelectionChange.fixSheetEnqueue",
    () => {
      startWorkflow(wf, step, { sheetName, startedBy: "onSelectionChange" });
    },
    200
  )();
}
