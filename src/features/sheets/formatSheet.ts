// formatSheet.ts
import { getErrorMessage } from "@lib/errors";
import { FastLog } from "@logging/FastLog";
import { hasFormatSheet } from "./core/sheetGuards";
import { getExtendedSheet } from "./getExtendedSheet";

export function formatSheet(sheetName: string): boolean {
  const fn = formatSheet.name;
  const startTime = FastLog.start(fn, sheetName);
  try {
    const sheet = getExtendedSheet(sheetName);

    if (!hasFormatSheet(sheet)) {
      // Optional: low-noise info so you can see when nothing happened
      FastLog.info(`${fn}: no formatSheet() on ${sheetName}`);
      return false;
    }

    sheet.formatSheet();
    return true;
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err);
    FastLog.error(fn, "failed", { sheetName, errorMessage });

    throw new Error(errorMessage);
  } finally {
    FastLog.finish(fn, startTime, sheetName);
  }
}
