import { queueJob } from "../../features/queue/queueJob";
import type { ParamsOf } from "../../features/queue/queueTypes";
import { FastLog } from "../../lib/logging/FastLog";

export function queueTrimSheet(parameters: ParamsOf<"TRIM_SHEET">): void {
  const startTime = FastLog.start("queueTrimSheet", parameters);
  const { sheetName } = parameters;

  queueJob("TRIM_SHEET", { sheetName: sheetName });

  FastLog.finish("queueTrimSheet", startTime, parameters);
}
