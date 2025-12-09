import { getErrorMessage } from "@lib/errors";
import { formatSheet } from "../../sheets/formatSheet";
import { registerStep } from "../workflowRegistry";
import type { FlowName, FormatSheetStepFn } from "../workflowTypes";

const FLOW_NAME = "formatSheetFlow" as FlowName;

export function formatSheetFlow(): void {
  // import step implementations here to register them
  registerStep(FLOW_NAME, formatSheetStep01);
}

const formatSheetStep01: FormatSheetStepFn = ({ input, log }) => {
  const fn = formatSheetStep01.name;
  const startTime = log.start(fn);
  try {
    const { sheetName } = input;

    formatSheet(sheetName);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
