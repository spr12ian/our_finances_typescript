// @workflow/flows/accountSheetBalanceValuesFlow.ts

import { getErrorMessage } from "@lib/errors";
import { ONE_MINUTE_MS, ONE_SECOND_MS } from "@lib/timeConstants";
import { updateBalanceValues } from "@sheets/updateBalanceValues";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";
import type { AccountSheetBalanceValuesFlowInput } from "./flowInputTypes";
import { normalizeFlowInput } from "./normalizeFlowInput";

const FLOW_NAME = "accountSheetBalanceValuesFlow";
const MAX_YIELD_STEPS = 3;

type AccountSheetBalanceValuesStepFn =
  StepFn<AccountSheetBalanceValuesFlowInput>;

export function accountSheetBalanceValuesFlow(): void {
  registerStep(FLOW_NAME, accountSheetBalanceValuesStep01);
  registerStep(FLOW_NAME, accountSheetBalanceValuesStep02);
  registerStep(FLOW_NAME, accountSheetBalanceValuesStep03);
  registerStep(FLOW_NAME, accountSheetBalanceValuesStep04);
}

const accountSheetBalanceValuesStep01: AccountSheetBalanceValuesStepFn = ({
  input,
  state,
  log,
}) => {
  const fn = accountSheetBalanceValuesStep01.name;
  const startTime = log.start(fn);
  try {
    // Normalise the (possibly partial) input for this flow
    const normalized = normalizeFlowInput(
      FLOW_NAME,
      (input ?? {}) as Partial<AccountSheetBalanceValuesFlowInput>
    ) as AccountSheetBalanceValuesFlowInput;

    log("accountSheetBalanceValuesStep01 normalized input:", normalized);

    const { accountSheetName, startRow } = normalized;

    state.e1 = updateBalanceValues(accountSheetName, startRow);

    // NOTE: no `input` in the result; `state` is allowed on `next`
    return {
      kind: "next",
      nextStep: "accountSheetBalanceValuesStep02",
      state,
    };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const accountSheetBalanceValuesStep02: AccountSheetBalanceValuesStepFn = ({
  input,
  state,
  log,
}) => {
  const fn = accountSheetBalanceValuesStep02.name;
  const startTime = log.start(fn);
  try {
    log("Starting accountSheetBalanceValuesStep02");
    const { accountSheetName, startRow } =
      input as AccountSheetBalanceValuesFlowInput;
    log("input:", input);
    log("state:", state);
    log("accountSheetName:", accountSheetName);
    log("startRow:", startRow);

    state.e2 = accountSheetBalanceValues2(accountSheetName, startRow);

    return { kind: "next", nextStep: "accountSheetBalanceValuesStep03", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const accountSheetBalanceValuesStep03: AccountSheetBalanceValuesStepFn = ({
  input,
  state,
  log,
}) => {
  const fn = accountSheetBalanceValuesStep03.name;
  const startTime = log.start(fn);
  try {
    log("Starting accountSheetBalanceValuesStep03");
    const { accountSheetName, startRow } =
      input as AccountSheetBalanceValuesFlowInput;
    log("input:", input);
    log("state:", state);
    log("accountSheetName:", accountSheetName);
    log("startRow:", startRow);

    const count = (state.yieldCount ?? 0) + 1;
    state.yieldCount = count;

    // do your poll/work here; set state.ready=true when done
    state.e3 = accountSheetBalanceValues3(accountSheetName, startRow);

    if (state.ready) {
      return {
        kind: "next",
        nextStep: "accountSheetBalanceValuesStep04",
        state,
      };
    }

    if (count >= MAX_YIELD_STEPS) {
      return {
        kind: "next",
        nextStep: "accountSheetBalanceValuesStep04",
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

const accountSheetBalanceValuesStep04: AccountSheetBalanceValuesStepFn = ({
  input,
  state,
  log,
}) => {
  const fn = accountSheetBalanceValuesStep04.name;
  const startTime = log.start(fn);
  try {
    log("Starting accountSheetBalanceValuesStep04");
    const { accountSheetName, startRow } =
      input as AccountSheetBalanceValuesFlowInput;
    log("input:", input);
    log("accountSheetName:", accountSheetName);
    log("startRow:", startRow);
    log("Final totals:", state.totals);

    state.e4 = accountSheetBalanceValues4(accountSheetName, startRow);

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

function accountSheetBalanceValues2(
  accountSheetName: string,
  startRow: number
): string {
  return `${accountSheetName} ${startRow}`;
}
function accountSheetBalanceValues3(
  accountSheetName: string,
  startRow: number
): string {
  return `${accountSheetName} ${startRow}`;
}
function accountSheetBalanceValues4(
  accountSheetName: string,
  startRow: number
): string {
  return `${accountSheetName} ${startRow}`;
}
