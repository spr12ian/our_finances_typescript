// @workflow/flows/bankAccountsBalancesFlow.ts
import { getErrorMessage } from "@lib/errors";
import { ONE_MINUTE, ONE_SECOND } from "@lib/timeConstants";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

const MAX_YIELD_STEPS = 3;

export type BankAccountsBalancesFlowInput = {
  parameter1: string;
  parameter2: number;
  startedBy?: string;
};

export function bankAccountsBalancesFlow(): void {
  registerStep(
    "bankAccountsBalancesFlow",
    "bankAccountsBalancesStep1",
    bankAccountsBalancesStep1
  );
  registerStep(
    "bankAccountsBalancesFlow",
    "bankAccountsBalancesStep2",
    bankAccountsBalancesStep2
  );
  registerStep(
    "bankAccountsBalancesFlow",
    "bankAccountsBalancesStep3",
    bankAccountsBalancesStep3
  );
  registerStep(
    "bankAccountsBalancesFlow",
    "bankAccountsBalancesStep4",
    bankAccountsBalancesStep4
  );
}

const bankAccountsBalancesStep1: StepFn = ({ input, state, log }) => {
  const fn = bankAccountsBalancesStep1.name;
  const startTime = log.start(fn);
  try {
    const { parameter1, parameter2, startedBy } =
      input as BankAccountsBalancesFlowInput;
    log("input:", input);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);
    log("startedBy:", startedBy);

    state.e1 = bankAccountsBalances(parameter1, parameter2);

    // NOTE: no `input` in the result; `state` is allowed on `next`
    return { kind: "next", nextStep: "bankAccountsBalancesStep2", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const bankAccountsBalancesStep2: StepFn = ({ input, state, log }) => {
  const fn = bankAccountsBalancesStep2.name;
  const startTime = log.start(fn);
  try {
    log("Starting bankAccountsBalancesStep2");
    const { parameter1, parameter2 } = input as BankAccountsBalancesFlowInput;
    log("input:", input);
    log("state:", state);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);

    state.e2 = bankAccountsBalances2(parameter1, parameter2);

    return { kind: "next", nextStep: "bankAccountsBalancesStep3", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const bankAccountsBalancesStep3: StepFn = ({ input, state, log }) => {
  const fn = bankAccountsBalancesStep3.name;
  const startTime = log.start(fn);
  try {
    log("Starting bankAccountsBalancesStep3");
    const { parameter1, parameter2 } = input as BankAccountsBalancesFlowInput;
    log("input:", input);
    log("state:", state);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);

    const count = (state.yieldCount ?? 0) + 1;
    state.yieldCount = count;

    // do your poll/work here; set state.ready=true when done
    state.e3 = bankAccountsBalances3(parameter1, parameter2);

    if (state.ready) {
      return { kind: "next", nextStep: "bankAccountsBalancesStep4", state };
    }

    if (count >= MAX_YIELD_STEPS) {
      return { kind: "next", nextStep: "bankAccountsBalancesStep4", state };
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

const bankAccountsBalancesStep4: StepFn = ({ input, state, log }) => {
  const fn = bankAccountsBalancesStep4.name;
  const startTime = log.start(fn);
  try {
    log("Starting bankAccountsBalancesStep4");
    const { parameter1, parameter2 } = input as BankAccountsBalancesFlowInput;
    log("input:", input);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);
    log("Final totals:", state.totals);

    state.e4 = bankAccountsBalances4(parameter1, parameter2);

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

function bankAccountsBalances(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
function bankAccountsBalances2(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
function bankAccountsBalances3(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
function bankAccountsBalances4(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
