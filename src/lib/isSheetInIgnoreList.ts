// src/lib/isSheetInIgnoreList.ts
import { FastLog } from "@logging/FastLog";

const QUEUE_SHEET_NAME = "$Queue";
const DEAD_SHEET_NAME = "QueueDead";
const STATUS = "$Status";

// ---------------------------
// Central ignore list registry
// ---------------------------
export const IGNORE_LISTS: Record<string, Set<string>> = {
  handleChange: new Set([QUEUE_SHEET_NAME, DEAD_SHEET_NAME, STATUS]),
  handleOpen: new Set([QUEUE_SHEET_NAME, DEAD_SHEET_NAME, STATUS]),
  onSelectionChange: new Set([QUEUE_SHEET_NAME, DEAD_SHEET_NAME, STATUS]),
  // Add more named ignore lists as needed:
  // e.g. onSelectionChange: new Set(["Config", "Status"]),
};

/**
 * Check whether a sheet name is in the specified ignore list.
 * @param sheetName - The name of the sheet being checked.
 * @param listName - The ignore list identifier (e.g. "handleOpen").
 * @returns true if the sheet should be ignored; false otherwise.
 */
export function isSheetInIgnoreList(
  sheetName: string,
  listName: keyof typeof IGNORE_LISTS
): boolean {
  const fn = isSheetInIgnoreList.name;
  const ignoreList = IGNORE_LISTS[listName];
  const isSheetInIgnoreList_ = ignoreList ? ignoreList.has(sheetName) : false;
  if (isSheetInIgnoreList_) {
    FastLog.info(
      fn,
      `→ ${listName} ignores sheet "${sheetName}"`
    );
  }
  return isSheetInIgnoreList_;
}
