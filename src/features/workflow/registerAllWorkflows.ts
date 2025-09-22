import { FastLog } from "@logging";
import { exampleFlow } from "./flows/exampleFlow";
import { fixSheetFlow } from "./flows/fixSheetFlow";
import { sendMeEmailFlow } from "./flows/sendMeEmailFlow";
import { trimSheetFlow } from "./flows/trimSheetFlow";

// Call once, e.g., inside onOpen or module top-level
export function registerAllWorkflows(): void {
  const startTime = FastLog.start(registerAllWorkflows.name);
  exampleFlow();
  fixSheetFlow();
  sendMeEmailFlow();
  trimSheetFlow();
  FastLog.finish(registerAllWorkflows.name, startTime);
}
