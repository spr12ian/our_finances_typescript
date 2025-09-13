import { fixSheet } from "../fixSheet";
import { getErrorMessage } from "../support/errors";
import { registerStep } from "./workflowEngine";
import type { StepFn } from "./workflowTypes";

export function onOpenFlow(): void {
  // import step implementations here to register them
  // (don't import from jobHandlers to avoid cycles)
  registerStep("onOpenFlow", "onOpenFixSheet", onOpenFixSheet);
  registerStep("onOpenFlow", "onOpenFlowStep2", onOpenFlowStep2);
  registerStep("onOpenFlow", "onOpenFlowStep3", onOpenFlowStep3);
}

const onOpenFixSheet: StepFn = ({ input, state, log }) => {
  const startTime = log.start(onOpenFixSheet.name);
  try {
    const { sheetName, startedBy } = input as {
      sheetName: string;
      startedBy: string;
    };
    log("sheetName:", sheetName);
    log("startedBy:", startedBy);

    fixSheet(sheetName);
    return { kind: "next", nextStep: "onOpenFlowStep2", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(onOpenFixSheet.name, startTime);
  }
};

const onOpenFlowStep2: StepFn = ({ state, log }) => {
  log("Starting onOpenFlowStep2");
  const totals: Record<string, { credit: number; debit: number }> =
    state.totals ?? {};
  return { kind: "next", nextStep: "onOpenFlowStep3", state: { totals } };
};

const onOpenFlowStep3: StepFn = ({ state, log }) => {
  log("Starting onOpenFlowStep3");
  log("Final totals:", state.totals);
  return { kind: "complete" };
};
