import { FastLog } from "./logging/FastLog";

export function logTime(label: string) {
  FastLog.log(`${label}: ${new Date().toISOString()}`);
}
