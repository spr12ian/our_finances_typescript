import { FastLog } from "../../lib/FastLog";
import { onOpenFlow } from "./onOpenFlow";

// Call once, e.g., inside onOpen or module top-level
export function registerAllWorkflows(): void {
  const startTime = FastLog.start(registerAllWorkflows.name);
  onOpenFlow();
  //registerWorkflow2();
  FastLog.finish(registerAllWorkflows.name, startTime);
}
