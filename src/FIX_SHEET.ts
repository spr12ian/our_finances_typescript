import { getExtendedSheet } from "./getExtendedSheet";
import type { ParamsOf } from "./queueTypes";
import { FastLog } from "./support/FastLog";

export function FIX_SHEET(parameters: ParamsOf<"FIX_SHEET">): void {
  FastLog.log("Started FIX_SHEET", parameters);
  const { sheetName } = parameters;

  const sheet = getExtendedSheet(sheetName);
  sheet.fixSheet();
  FastLog.log("Finished FIX_SHEET", parameters);
}
