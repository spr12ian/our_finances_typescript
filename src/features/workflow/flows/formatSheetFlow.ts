import { getErrorMessage } from "@lib/errors";
import { formatSheet } from "../../sheets/formatSheet";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

export type FormatSheetFlowInput = {
  sheetName: string;
  queuedBy?: string;
};

export function formatSheetFlow(): void {
  // import step implementations here to register them
  registerStep("formatSheetFlow", "formatSheetStep1", formatSheetStep1);
}

const formatSheetStep1: StepFn = ({ input, log }) => {
  const fn = formatSheetStep1.name;
  const startTime = log.start(fn);
  try {
    const { sheetName, queuedBy } = input as FormatSheetFlowInput;
    log("sheetName:", sheetName);
    log("queuedBy:", queuedBy);

    formatSheet(sheetName);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
