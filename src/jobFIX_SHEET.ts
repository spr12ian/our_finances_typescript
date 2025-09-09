import { getExtendedSheet } from "./getExtendedSheet";
import type { ParamsOf } from "./queueTypes";
import { FastLog } from "./support/FastLog";

const JOB_NAME = "FIX_SHEET";
export function FIX_SHEET(parameters: ParamsOf<"FIX_SHEET">): void {
  const startTime = FastLog.start(`${JOB_NAME}`, parameters);
  const { sheetName } = parameters;
  const sheet = getExtendedSheet(sheetName);

  sheet.fixSheet();
  FastLog.finish(`${JOB_NAME}`, startTime, parameters);
}
