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
  registerStep("fixSheetFlow", "fixSheetFlowStep2", fixSheetFlowStep2);
  registerStep("fixSheetFlow", "fixSheetFlowStep3", fixSheetFlowStep3);
}

const fixSheetStep1: StepFn = ({ input, state, log }) => {
  const fn = fixSheetStep1.name;
  const startTime = log.start(fn);
  try {
    const { sheetName, startedBy } = input as FixSheetFlowInput;
    log("sheetName:", sheetName);
    log("startedBy:", startedBy);

    fixSheet(sheetName);
    return { kind: "next", nextStep: "fixSheetFlowStep2", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const fixSheetFlowStep2: StepFn = ({ state, log }) => {
  log("Starting fixSheetFlowStep2");
  const totals: Record<string, { credit: number; debit: number }> =
    state.totals ?? {};
  return { kind: "next", nextStep: "fixSheetFlowStep3", state: { totals } };
};

const fixSheetFlowStep3: StepFn = ({ state, log }) => {
  log("Starting fixSheetFlowStep3");
  log("Final totals:", state.totals);
  return { kind: "complete" };
};
