import { getErrorMessage } from "@lib/errors";
import { normalizeFlowInput } from "@workflow/normalizeFlowInput";
import type { FixSheetStepFn } from "@workflow/workflowTypes";
import { fixSheet } from "../../sheets/fixSheet";
import { registerStep } from "../workflowRegistry";

const FLOW_NAME = "fixSheetFlow" as const;

export function fixSheetFlow(): void {
  // import step implementations here to register them
  registerStep(FLOW_NAME, fixSheetStep01);
}

const fixSheetStep01: FixSheetStepFn = ({ input, log }) => {
  const fn = fixSheetStep01.name;
  const startTime = log.start(fn);
  try {
    const normalized = normalizeFlowInput(FLOW_NAME, input ?? {});

    log(`${fn}: normalized input:`, normalized);

    const { sheetName } = normalized;

    fixSheet(sheetName);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
