import { getExtendedSheet } from "./getExtendedSheet";
import type { ParamsOf } from "./queueTypes";
import { FastLog } from "./support/FastLog";

const JOB_NAME = "FORMAT_SHEET";
export function FORMAT_SHEET(parameters: ParamsOf<"FORMAT_SHEET">): void {
  const startTime = FastLog.start(`${JOB_NAME}`, parameters);
  const { sheetName } = parameters;
  const sheet = getExtendedSheet(sheetName);

  sheet.formatSheet();
  FastLog.finish(`${JOB_NAME}`, startTime, parameters);
}
