import { getExtendedSheet } from "./getExtendedSheet";
import type { ParamsOf } from "./queueTypes";
import { FastLog } from "./support/FastLog";

const JOB_NAME = "TRIM_SHEET";
export function TRIM_SHEET(parameters: ParamsOf<"TRIM_SHEET">): void {
  const startTime = FastLog.start(`${JOB_NAME}`, parameters);
  const { sheetName } = parameters;
  const sheet = getExtendedSheet(sheetName);

  sheet.trimSheet();
  FastLog.finish(`${JOB_NAME}`, startTime, parameters);
}
