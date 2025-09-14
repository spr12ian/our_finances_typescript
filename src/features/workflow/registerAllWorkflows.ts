import { FastLog } from "../../lib/logging/FastLog";
import { fixSheetFlow } from "./fixSheetFlow";

// Call once, e.g., inside onOpen or module top-level
export function registerAllWorkflows(): void {
  const startTime = FastLog.start(registerAllWorkflows.name);
  fixSheetFlow();
  //registerWorkflow2();
  FastLog.finish(registerAllWorkflows.name, startTime);
}
