import { FastLog } from "@lib/logging/FastLog";
import { queueJob } from "../queue/queueJob";
import type { ParamsOf } from "../queue/queueTypes";

export function queueFormatSheet(parameters: ParamsOf<"FORMAT_SHEET">): void {
  const startTime = FastLog.start("queueFormatSheet", parameters);
  const { sheetName } = parameters;

  queueJob("FORMAT_SHEET", { sheetName: sheetName });

  FastLog.finish("queueFormatSheet", startTime, parameters);
}
