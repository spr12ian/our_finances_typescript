import { FastLog } from '@lib/logging';
import { getSheetByName } from "./getSheetByName";

export function goToSheet(sheetName: string): void {
  FastLog.info(`Going to sheet: ${sheetName}`);
  const sheet = getSheetByName(sheetName);

  sheet.activate();
}
