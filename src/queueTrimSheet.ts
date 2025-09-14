import { FastLog } from "./lib/FastLog";
import { queueJob } from "./queueJob";
import type { ParamsOf } from "./queueTypes";

export function queueTrimSheet(parameters: ParamsOf<"TRIM_SHEET">): void {
  const startTime = FastLog.start("queueTrimSheet", parameters);
  const { sheetName } = parameters;

  queueJob("TRIM_SHEET", { sheetName: sheetName });

  FastLog.finish("queueTrimSheet", startTime, parameters);
}
