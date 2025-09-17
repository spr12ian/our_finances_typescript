import { FastLog } from '@lib/logging';
import { getSheetNames } from "./getSheetNames";

export function logSheetNames(): void {
  const sheetNames = getSheetNames();
  FastLog.info(sheetNames);
}
