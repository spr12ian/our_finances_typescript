// Minimal shape of the event object we care about for selection-change.
export interface SelectionChangeEventLike {
  range: GoogleAppsScript.Spreadsheet.Range;
  source: GoogleAppsScript.Spreadsheet.Spreadsheet;
}

type SheetsTriggerEvent =
  | GoogleAppsScript.Events.SheetsOnEdit
  | GoogleAppsScript.Events.SheetsOnOpen
  | GoogleAppsScript.Events.SheetsOnChange
  | SelectionChangeEventLike;

/**
 * Safely extract the active Sheet from an Apps Script event object.
 * Handles both missing and malformed trigger events.
 */
export function getTriggerEventSheet(
  e: SheetsTriggerEvent
): GoogleAppsScript.Spreadsheet.Sheet {
  const fn = getTriggerEventSheet.name;

  if (!e) throw new Error(`${fn}: No event object provided`);

  const range = (e as any).range;
  if (!range || typeof range.getSheet !== "function") {
    throw new Error(
      `${fn}: Event object missing a valid range or getSheet() method`
    );
  }

  try {
    const sheet = range.getSheet();
    if (!sheet) {
      throw new Error(`${fn}: getSheet() returned null/undefined`);
    }
    return sheet;
  } catch (err) {
    throw new Error(`${fn}: Error calling getSheet(): ${String(err)}`);
  }
}
