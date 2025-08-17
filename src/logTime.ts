
import { FastLog } from "./FastLog";

export function logTime(label: string) {
  FastLog.log(`${label}: ${new Date().toISOString()}`);
}
