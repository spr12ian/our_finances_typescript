import { FastLog } from '@lib/logging';
import { getSheetByName } from "./getSheetByName";

export function goToSheet(sheetName: string): void {
  const sheet = getSheetByName(sheetName);

  FastLog.info(`Going to sheet: ${sheetName}`);
  sheet.activate();
}
