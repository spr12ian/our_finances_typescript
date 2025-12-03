// @workflow/flows/accountSheetBalanceValuesFlow.ts

import { getErrorMessage } from "@lib/errors";
import { ONE_MINUTE_MS, ONE_SECOND_MS } from "@lib/timeConstants";
import { updateBalanceValues } from "@sheets/updateBalanceValues";
import { withNormalizedFlowInput } from "../withNormalizedFlowInput";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";
import type { UpdateBalanceValuesFlowInput } from "./flowInputTypes";

const MAX_YIELD_STEPS = 3;

export function accountSheetBalanceValuesFlow(): void {
  registerStep("accountSheetBalanceValuesFlow", updateBalanceValuesStep1);
  registerStep("accountSheetBalanceValuesFlow", updateBalanceValuesStep2);
  registerStep("accountSheetBalanceValuesFlow", updateBalanceValuesStep3);
  registerStep("accountSheetBalanceValuesFlow", updateBalanceValuesStep4);
}

const updateBalanceValuesStep1: StepFn = withNormalizedFlowInput(
  "accountSheetBalanceValuesFlow",
  ({ input, state, log }) => {
    const fn = updateBalanceValuesStep1.name;
    const startTime = log.start(fn);
    try {
      log("input:", input);
      const { accountSheetName, startRow, queuedBy } = input;
      log("accountSheetName:", accountSheetName);
      log("startRow:", startRow);
      log("queuedBy:", queuedBy);

      state.e1 = updateBalanceValues(accountSheetName, startRow);

      // NOTE: no `input` in the result; `state` is allowed on `next`
      return { kind: "next", nextStep: "updateBalanceValuesStep2", state };
    } catch (err) {
      log.error(err);
      return { kind: "fail", reason: getErrorMessage(err), retryable: true };
    } finally {
      log.finish(fn, startTime);
    }
  }
);

const updateBalanceValuesStep2: StepFn = ({ input, state, log }) => {
  const fn = updateBalanceValuesStep2.name;
  const startTime = log.start(fn);
  try {
    log("Starting updateBalanceValuesStep2");
    const { accountSheetName, startRow } =
      input as UpdateBalanceValuesFlowInput;
    log("input:", input);
    log("state:", state);
    log("accountSheetName:", accountSheetName);
    log("startRow:", startRow);

    state.e2 = updateAccountSheetBalances2(accountSheetName, startRow);

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
    const { accountSheetName, startRow } =
      input as UpdateBalanceValuesFlowInput;
    log("input:", input);
    log("state:", state);
    log("accountSheetName:", accountSheetName);
    log("startRow:", startRow);

    const count = (state.yieldCount ?? 0) + 1;
    state.yieldCount = count;

    // do your poll/work here; set state.ready=true when done
    state.e3 = updateAccountSheetBalances3(accountSheetName, startRow);

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
    const { accountSheetName, startRow } =
      input as UpdateBalanceValuesFlowInput;
    log("input:", input);
    log("accountSheetName:", accountSheetName);
    log("startRow:", startRow);
    log("Final totals:", state.totals);

    state.e4 = updateAccountSheetBalances4(accountSheetName, startRow);

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

function updateAccountSheetBalances2(
  accountSheetName: string,
  startRow: number
): string {
  return `${accountSheetName} ${startRow}`;
}
function updateAccountSheetBalances3(
  accountSheetName: string,
  startRow: number
): string {
  return `${accountSheetName} ${startRow}`;
}
function updateAccountSheetBalances4(
  accountSheetName: string,
  startRow: number
): string {
  return `${accountSheetName} ${startRow}`;
}
