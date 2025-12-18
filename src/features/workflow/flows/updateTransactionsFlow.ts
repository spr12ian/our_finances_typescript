// @workflow/flows/updateTransactionsFlow.ts
import { getErrorMessage } from "@lib/errors";
import { updateTransactionsFormula } from "@sheets/updateTransactionsFormula";
import { registerStep } from "../workflowRegistry";
import type { FlowName, UpdateTransactionsStepFn } from "../workflowTypes";
import { trimSheet } from '@sheets/trimSheet';

const FLOW_NAME = "updateTransactionsFlow" as FlowName;

export function updateTransactionsFlow(): void {
  registerStep(FLOW_NAME, updateTransactionsStep01);
  registerStep(FLOW_NAME, updateTransactionsStep02);
}

const updateTransactionsStep01: UpdateTransactionsStepFn = ({
  state,
  log,
}) => {
  const fn = updateTransactionsStep01.name;
  const startTime = log.start(fn);

  try {
    state.step1 = updateTransactionsFormula();
    state.sheetName = "Transactions";

    return { kind: "next", nextStep: "updateTransactionsStep02", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
const updateTransactionsStep02: UpdateTransactionsStepFn = ({
  state,
  log,
}) => {
  const fn = updateTransactionsStep02.name;
  const startTime = log.start(fn);
  try {
    const { sheetName } = state;

    trimSheet(sheetName);
    return { kind: "complete" };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
