import { getErrorMessage } from "@lib/errors";
import { fixSheet } from "../../sheets/fixSheet";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

export type FixSheetFlowInput = {
  sheetName: string;
  startedBy?: string;
};

export function fixSheetFlow(): void {
  // import step implementations here to register them
  registerStep("fixSheetFlow", "fixSheetStep1", fixSheetStep1);
}

const fixSheetStep1: StepFn = ({ input, log }) => {
  const fn = fixSheetStep1.name;
  const startTime = log.start(fn);
  try {
    const { sheetName, startedBy } = input as FixSheetFlowInput;
    log("sheetName:", sheetName);
    log("startedBy:", startedBy);

    fixSheet(sheetName);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
