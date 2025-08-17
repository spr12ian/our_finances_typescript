import { FastLog } from "./FastLog";

  import { isAccountSheetName } from './accountSheetFunctions';
  import { Sheet } from './Sheet';
  import { AccountSheet } from './AccountSheet';
import { columnNumberToLetter } from './NumberUtils';

  const handlerFunctions = [
    isAccountSheetName, HTMLTableRowElement, columnNumberToLetter(, )
  ]
export function onEditHandler(e: GoogleAppsScript.Events.SheetsOnEdit): void {
  FastLog.log(`Started OurFinances.onEdit`);
  FastLog.log(`Edit event: ${JSON.stringify(e, null, 2)}`);

  let shouldUpdate = false;

  const gasSheet = e.source?.getActiveSheet?.();
  const sheetName = gasSheet?.getName?.();
  FastLog.log(`Edit made in sheet: ${sheetName ?? "(unknown)"}`);

  if (isAccountSheetName(sheetName)) {
    const sheet = new Sheet(gasSheet);
    new AccountSheet(sheet, this.#spreadsheet).onEdit(e);
    FastLog.log(`Sheet ${sheetName} is an account sheet.`);

    const range = e.range;
    if (range) {
      FastLog.log(`Edit made in range: ${range.getA1Notation()}`);

      const WATCHED_COLS = new Set<number>([3, 4, 8]); // Credit, Debit, Balance
      const touchesWatched = intersectsWatchedCols(range, WATCHED_COLS);

      if (touchesWatched) {
        // For single-cell edits, only update if the value actually changed.
        const isSingleCell =
          range.getNumRows() === 1 && range.getNumColumns() === 1;
        if (isSingleCell) {
          const actuallyChanged = e.value !== e.oldValue; // note: undefined vs string handles clears
          shouldUpdate = actuallyChanged;
          if (!actuallyChanged) {
            FastLog.log(`No-op single-cell edit detected (value unchanged).`);
          }
        } else {
          // Multi-cell edit that touches watched columns → always update
          shouldUpdate = true;
        }
      }
    }
  }

  if (shouldUpdate) {
    this.updateBalanceValues();
  }

  FastLog.log(`Finished OurFinances.onEdit`);
  return;
}
