import { FastLog } from "@logging";
import { fixSheetFlow } from "./fixSheetFlow";
import { trimSheetFlow } from "./trimSheetFlow";

// Call once, e.g., inside onOpen or module top-level
export function registerAllWorkflows(): void {
  const startTime = FastLog.start(registerAllWorkflows.name);
  fixSheetFlow();
  trimSheetFlow();
  FastLog.finish(registerAllWorkflows.name, startTime);
}
