// @workflow/flows/updateAccountSheetBalancesFlow.ts
import { getErrorMessage } from "@lib/errors";
import { ONE_MINUTE, ONE_SECOND } from "@lib/timeConstants";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

const MAX_YIELD_STEPS = 3;

export type UpdateBalanceValuesFlowInput = {
  sheetName: string;
  row: number;
  startedBy?: string;
};

export function updateAccountSheetBalancesFlow(): void {
  registerStep(
    "updateAccountSheetBalancesFlow",
    "updateAccountSheetBalancesStep1",
    updateAccountSheetBalancesStep1
  );
  registerStep(
    "updateAccountSheetBalancesFlow",
    "updateAccountSheetBalancesStep2",
    updateAccountSheetBalancesStep2
  );
  registerStep(
    "updateAccountSheetBalancesFlow",
    "updateAccountSheetBalancesStep3",
    updateAccountSheetBalancesStep3
  );
  registerStep(
    "updateAccountSheetBalancesFlow",
    "updateAccountSheetBalancesStep4",
    updateAccountSheetBalancesStep4
  );
}

const updateAccountSheetBalancesStep1: StepFn = ({ input, state, log }) => {
  const fn = updateAccountSheetBalancesStep1.name;
  const startTime = log.start(fn);
  try {
    const { sheetName, row, startedBy } = input as UpdateBalanceValuesFlowInput;
    log("input:", input);
    log("sheetName:", sheetName);
    log("row:", row);
    log("startedBy:", startedBy);

    state.e1 = updateAccountSheetBalances(sheetName, row);

    // NOTE: no `input` in the result; `state` is allowed on `next`
    return { kind: "next", nextStep: "updateAccountSheetBalancesStep2", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const updateAccountSheetBalancesStep2: StepFn = ({ input, state, log }) => {
  const fn = updateAccountSheetBalancesStep2.name;
  const startTime = log.start(fn);
  try {
    log("Starting updateAccountSheetBalancesStep2");
    const { sheetName, row } = input as UpdateBalanceValuesFlowInput;
    log("input:", input);
    log("state:", state);
    log("sheetName:", sheetName);
    log("row:", row);

    state.e2 = updateAccountSheetBalances2(sheetName, row);

    return { kind: "next", nextStep: "updateAccountSheetBalancesStep3", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const updateAccountSheetBalancesStep3: StepFn = ({ input, state, log }) => {
  const fn = updateAccountSheetBalancesStep3.name;
  const startTime = log.start(fn);
  try {
    log("Starting updateAccountSheetBalancesStep3");
    const { sheetName, row } = input as UpdateBalanceValuesFlowInput;
    log("input:", input);
    log("state:", state);
    log("sheetName:", sheetName);
    log("row:", row);

    const count = (state.yieldCount ?? 0) + 1;
    state.yieldCount = count;

    // do your poll/work here; set state.ready=true when done
    state.e3 = updateAccountSheetBalances3(sheetName, row);

    if (state.ready) {
      return {
        kind: "next",
        nextStep: "updateAccountSheetBalancesStep4",
        state,
      };
    }

    if (count >= MAX_YIELD_STEPS) {
      return {
        kind: "next",
        nextStep: "updateAccountSheetBalancesStep4",
        state,
      };
    }

    // not ready yet — back off
    const delayMs = Math.min(ONE_MINUTE, ONE_SECOND * 2 ** (count - 1)); // 1s,2s,4s,... max 60s
    return { kind: "yield", state, delayMs: delayMs };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const updateAccountSheetBalancesStep4: StepFn = ({ input, state, log }) => {
  const fn = updateAccountSheetBalancesStep4.name;
  const startTime = log.start(fn);
  try {
    log("Starting updateAccountSheetBalancesStep4");
    const { sheetName, row } = input as UpdateBalanceValuesFlowInput;
    log("input:", input);
    log("sheetName:", sheetName);
    log("row:", row);
    log("Final totals:", state.totals);

    state.e4 = updateAccountSheetBalances4(sheetName, row);

    // `complete` supports `output`, not `state`
    const output = {
      done: true,
      e1: state.e1,
      e2: state.e2,
      e3: state.e3,
      e4: state.e4,
    };
    return { kind: "complete", output };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

function updateAccountSheetBalances(sheetName: string, row: number): string {
  return `${sheetName} ${row}`;
}
function updateAccountSheetBalances2(sheetName: string, row: number): string {
  return `${sheetName} ${row}`;
}
function updateAccountSheetBalances3(sheetName: string, row: number): string {
  return `${sheetName} ${row}`;
}
function updateAccountSheetBalances4(sheetName: string, row: number): string {
  return `${sheetName} ${row}`;
}
