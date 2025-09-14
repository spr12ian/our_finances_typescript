import { FastLog } from "./lib/FastLog";
import { queueJob } from "./queueJob";
import type { ParamsOf } from "./queueTypes";

export function queueFormatSheet(parameters: ParamsOf<"FORMAT_SHEET">): void {
  const startTime = FastLog.start("queueFormatSheet", parameters);
  const { sheetName } = parameters;

  queueJob("FORMAT_SHEET", { sheetName: sheetName });

  FastLog.finish("queueFormatSheet", startTime, parameters);
}
