// trimSheet.ts
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@logging/FastLog";
import { getExtendedSheet } from "./getExtendedSheet";

export function trimSheet(sheetName: string): boolean {
  const fn = trimSheet.name;
  const startTime = FastLog.start(fn, sheetName);
  try {
    const sheet = getExtendedSheet(sheetName);

    sheet.trimSheet();
    return true;
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, "failed", { sheetName, errorMessage });

    throw new Error(errorMessage);
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
