import { FastLog } from "@logging";
import { queueJob } from "@queue/queueJob";
import type { ParamsOf } from "@queue/queueTypes";

export function queueTrimSheet(parameters: ParamsOf<"TRIM_SHEET">): void {
  const startTime = FastLog.start("queueTrimSheet", parameters);
  const { sheetName } = parameters;

  queueJob("TRIM_SHEET", { sheetName: sheetName });

  FastLog.finish("queueTrimSheet", startTime, parameters);
}
