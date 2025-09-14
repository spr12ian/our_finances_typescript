// fixSheet.ts
import { getExtendedSheet, hasFixSheet } from "./getExtendedSheet";
import { FastLog } from "./lib/FastLog";
import { getErrorMessage } from "./lib/errors";

export function fixSheet(sheetName: string): boolean {
  const fn = fixSheet.name;
  const startTime = FastLog.start(fn, sheetName);
  try {
    const sheet = getExtendedSheet(sheetName);

    if (!hasFixSheet(sheet)) {
      // Optional: low-noise info so you can see when nothing happened
      FastLog.info(`${fn}: no fixSheet() on ${sheetName}`);
      return false;
    }

    sheet.fixSheet();
    return true;
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, "failed", { sheetName, errorMessage });

    throw new Error(errorMessage);
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
