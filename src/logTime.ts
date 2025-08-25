
import { FastLog } from "./support/FastLog";

export function logTime(label: string) {
  FastLog.log(`${label}: ${new Date().toISOString()}`);
}
