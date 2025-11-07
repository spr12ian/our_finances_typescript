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

  // 1) Range-based events: onEdit, onChange (with range), onSelectionChange
  const range = (e as any).range;
  if (range && typeof range.getSheet === "function") {
    try {
      const sheet = range.getSheet();
      if (!sheet) {
        throw new Error(`${fn}: range.getSheet() returned null/undefined`);
      }
      return sheet;
    } catch (err) {
      throw new Error(`${fn}: Error calling range.getSheet(): ${String(err)}`);
    }
  }

  // 2) Source-based events: onOpen (installable / simple)
  const source = (e as any).source;
  if (source && typeof source.getActiveSheet === "function") {
    try {
      const sheet = source.getActiveSheet();
      if (!sheet) {
        throw new Error(`${fn}: source.getActiveSheet() returned null/undefined`);
      }
      return sheet;
    } catch (err) {
      throw new Error(`${fn}: Error calling source.getActiveSheet(): ${String(err)}`);
    }
  }

  // 3) Completely unexpected shape
  try {
    const eJson = JSON.stringify(e);
    throw new Error(
      `${fn}: Event object missing both range and source.getActiveSheet(): ${eJson}`
    );
  } catch {
    throw new Error(
      `${fn}: Event object missing both range and source.getActiveSheet(), and could not stringify`
    );
  }
}
