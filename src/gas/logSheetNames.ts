import { FastLog } from "@lib/logging";
import { getSheetNames } from "./getSheetNames";

export function logSheetNames(): void {
  const fn = logSheetNames.name;
  const startTime = FastLog.start(fn);

  const sheetNames = getSheetNames();
  FastLog.log(sheetNames.length + " sheets:");
  FastLog.info(sheetNames);
  FastLog.finish(fn, startTime);
}
