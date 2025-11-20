// src/features/account/handlers/debouncedOnEditRecalcBalances.ts
import { FastLog } from "@logging/FastLog";
import type { SheetsOnEdit } from "./onEditRecalcBalances";
import { onEditRecalcBalances } from "./onEditRecalcBalances";

/**
 * Coarse debounce per sheet to avoid multiple recalc runs in a burst of edits.
 * Uses CacheService with a short TTL.
 */
export function debouncedOnEditRecalcBalances(e: SheetsOnEdit): void {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetId = sheet.getSheetId();
  const cache = CacheService.getDocumentCache();

  if (!cache) {
    // Fallback: just run the original handler
    onEditRecalcBalances(e);
    return;
  }

  const cacheKey = `recalcBalances:sheet:${sheetId}`;

  if (cache.get(cacheKey)) {
    FastLog.log("debouncedOnEditRecalcBalances → skipped (recent recalc)");
    return;
  }

  // Mark this sheet as “recently recalculated” for a few seconds
  cache.put(cacheKey, "1", 5); // 5s TTL; tweak to taste

  onEditRecalcBalances(e);
}
