import { getErrorMessage } from "@lib/errors";
import { trimSheet } from "@sheets/trimSheet";
import { registerStep } from "../workflowRegistry";
import type { TrimSheetStepFn, FlowName } from "../workflowTypes";

const FLOW_NAME = "trimSheetFlow" as FlowName;

export function trimSheetFlow(): void {
  // import step implementations here to register them
  registerStep(FLOW_NAME, "trimSheetStep01", trimSheetStep01);
}

const trimSheetStep01: TrimSheetStepFn = ({ input, log }) => {
  const fn = trimSheetStep01.name;
  const startTime = log.start(fn);
  try {
    const { sheetName } = input;

    trimSheet(sheetName);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
