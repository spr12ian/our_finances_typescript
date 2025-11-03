// @workflow/flows/exampleFlow.ts
import { getErrorMessage } from "@lib/errors";
import { ONE_MINUTE_MS, ONE_SECOND_MS } from "@lib/timeConstants";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

const MAX_YIELD_STEPS = 3;

export type ExampleFlowInput = {
  parameter1: string;
  parameter2: number;
  startedBy?: string;
};

export function exampleFlow(): void {
  registerStep("exampleFlow", "exampleStep1", exampleStep1);
  registerStep("exampleFlow", "exampleStep2", exampleStep2);
  registerStep("exampleFlow", "exampleStep3", exampleStep3);
  registerStep("exampleFlow", "exampleStep4", exampleStep4);
}

const exampleStep1: StepFn = ({ input, state, log }) => {
  const fn = exampleStep1.name;
  const startTime = log.start(fn);
  try {
    const { parameter1, parameter2, startedBy } = input as ExampleFlowInput;
    log("input:", input);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);
    log("startedBy:", startedBy);

    state.e1 = example(parameter1, parameter2);

    // NOTE: no `input` in the result; `state` is allowed on `next`
    return { kind: "next", nextStep: "exampleStep2", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const exampleStep2: StepFn = ({ input, state, log }) => {
  const fn = exampleStep2.name;
  const startTime = log.start(fn);
  try {
    log("Starting exampleStep2");
    const { parameter1, parameter2 } = input as ExampleFlowInput;
    log("input:", input);
    log("state:", state);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);

    state.e2 = example2(parameter1, parameter2);

    return { kind: "next", nextStep: "exampleStep3", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const exampleStep3: StepFn = ({ input, state, log }) => {
  const fn = exampleStep3.name;
  const startTime = log.start(fn);
  try {
    log("Starting exampleStep3");
    const { parameter1, parameter2 } = input as ExampleFlowInput;
    log("input:", input);
    log("state:", state);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);

    const count = (state.yieldCount ?? 0) + 1;
    state.yieldCount = count;

    // do your poll/work here; set state.ready=true when done
    state.e3 = example3(parameter1, parameter2);

    if (state.ready) {
      return { kind: "next", nextStep: "exampleStep4", state };
    }

    if (count >= MAX_YIELD_STEPS) {
      return { kind: "next", nextStep: "exampleStep4", state };
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

const exampleStep4: StepFn = ({ input, state, log }) => {
  const fn = exampleStep4.name;
  const startTime = log.start(fn);
  try {
    log("Starting exampleStep4");
    const { parameter1, parameter2 } = input as ExampleFlowInput;
    log("input:", input);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);
    log("Final totals:", state.totals);

    state.e4 = example4(parameter1, parameter2);

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

function example(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
function example2(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
function example3(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
function example4(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
