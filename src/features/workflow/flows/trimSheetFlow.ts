import { getErrorMessage } from "@lib/errors";
import { trimSheet } from "@sheets/trimSheet";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

export function trimSheetFlow(): void {
  // import step implementations here to register them
  registerStep("trimSheetFlow", "trimSheetStep1", trimSheetStep1);
}

const trimSheetStep1: StepFn = ({ input, state, log }) => {
  const fn = trimSheetStep1.name;
  const startTime = log.start(fn);
  try {
    const { sheetName, startedBy } = input as {
      sheetName: string;
      startedBy: string;
    };
    log("sheetName:", sheetName);
    log("startedBy:", startedBy);
    log("state:", state);

    trimSheet(sheetName);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
