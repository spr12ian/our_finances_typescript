import { functionStart } from "@logging";
import * as flow from "./flows";

// Call once, e.g., inside onOpen or module top-level
export function registerAllWorkflows(): void {
  const finish = functionStart(registerAllWorkflows.name);
  flow.exampleFlow();
  flow.fixSheetFlow();
  flow.formatSheetFlow();
  flow.bankAccountsBalancesFlow();
  flow.sendMeHtmlEmailFlow();
  flow.trimSheetFlow();
  finish();
}
