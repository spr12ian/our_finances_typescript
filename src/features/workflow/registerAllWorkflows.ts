import { FastLog } from "@logging";
import { exampleFlow } from "./flows/exampleFlow";
import { fixSheetFlow } from "./flows/fixSheetFlow";
import { formatSheetFlow } from "./flows/formatSheetFlow";
import { sendMeHtmlEmailFlow } from "./flows/sendMeHtmlEmailFlow";
import { trimSheetFlow } from "./flows/trimSheetFlow";

// Call once, e.g., inside onOpen or module top-level
export function registerAllWorkflows(): void {
  const startTime = FastLog.start(registerAllWorkflows.name);
  exampleFlow();
  fixSheetFlow();
  formatSheetFlow();
  sendMeHtmlEmailFlow();
  trimSheetFlow();
  FastLog.finish(registerAllWorkflows.name, startTime);
}
