// @workflow/flows/updateBalanceValuesFlow.ts
import { getErrorMessage } from "@lib/errors";
import { ONE_MINUTE_MS, ONE_SECOND_MS } from "@lib/timeConstants";
import { updateBalanceValues } from "@sheets/updateBalanceValues";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

const MAX_YIELD_STEPS = 3;

export type UpdateBalanceValuesFlowInput = {
  sheetName: string;
  row: number;
  startedBy?: string;
};

export function updateBalanceValuesFlow(): void {
  registerStep(
    "updateBalanceValuesFlow",
    "updateBalanceValuesStep1",
    updateBalanceValuesStep1
  );
  registerStep(
    "updateBalanceValuesFlow",
    "updateBalanceValuesStep2",
    updateBalanceValuesStep2
  );
  registerStep(
    "updateBalanceValuesFlow",
    "updateBalanceValuesStep3",
    updateBalanceValuesStep3
  );
  registerStep(
    "updateBalanceValuesFlow",
    "updateBalanceValuesStep4",
    updateBalanceValuesStep4
  );
}

const updateBalanceValuesStep1: StepFn = ({ input, state, log }) => {
  const fn = updateBalanceValuesStep1.name;
  const startTime = log.start(fn);
  try {
    const { sheetName, row, startedBy } = input as UpdateBalanceValuesFlowInput;
    log("input:", input);
    log("sheetName:", sheetName);
    log("row:", row);
    log("startedBy:", startedBy);

    state.e1 = updateBalanceValues(sheetName, row);

    // NOTE: no `input` in the result; `state` is allowed on `next`
    return { kind: "next", nextStep: "updateBalanceValuesStep2", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const updateBalanceValuesStep2: StepFn = ({ input, state, log }) => {
  const fn = updateBalanceValuesStep2.name;
  const startTime = log.start(fn);
  try {
    log("Starting updateBalanceValuesStep2");
    const { sheetName, row } = input as UpdateBalanceValuesFlowInput;
    log("input:", input);
    log("state:", state);
    log("sheetName:", sheetName);
    log("row:", row);

    state.e2 = updateAccountSheetBalances2(sheetName, row);

    return { kind: "next", nextStep: "updateBalanceValuesStep3", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const updateBalanceValuesStep3: StepFn = ({ input, state, log }) => {
  const fn = updateBalanceValuesStep3.name;
  const startTime = log.start(fn);
  try {
    log("Starting updateBalanceValuesStep3");
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
        nextStep: "updateBalanceValuesStep4",
        state,
      };
    }

    if (count >= MAX_YIELD_STEPS) {
      return {
        kind: "next",
        nextStep: "updateBalanceValuesStep4",
        state,
      };
    }

    // not ready yet — back off
    const delayMs = Math.min(ONE_MINUTE_MS, ONE_SECOND_MS * 2 ** (count - 1)); // 1s,2s,4s,... max 60s
    return { kind: "yield", state, delayMs: delayMs };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const updateBalanceValuesStep4: StepFn = ({ input, state, log }) => {
  const fn = updateBalanceValuesStep4.name;
  const startTime = log.start(fn);
  try {
    log("Starting updateBalanceValuesStep4");
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

function updateAccountSheetBalances2(sheetName: string, row: number): string {
  return `${sheetName} ${row}`;
}
function updateAccountSheetBalances3(sheetName: string, row: number): string {
  return `${sheetName} ${row}`;
}
function updateAccountSheetBalances4(sheetName: string, row: number): string {
  return `${sheetName} ${row}`;
}
