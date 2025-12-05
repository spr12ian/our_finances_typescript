// @workflow/flows/templateFlow.ts
import { getErrorMessage } from "@lib/errors";
import { ONE_MINUTE_MS, ONE_SECOND_MS } from "@lib/timeConstants";
import { normalizeFlowInput } from "../normalizeFlowInput";
import { registerStep } from "../workflowRegistry";
import type { StepFn } from "../workflowTypes";

const FLOW_NAME = "templateFlow";
const MAX_YIELD_STEPS = 3;

export type TemplateFlowInput = {
  parameter1: string;
  parameter2: number;
};

type TemplateStepFn = StepFn<TemplateFlowInput>;

export function templateFlow(): void {
  registerStep(FLOW_NAME, templateStep01);
  registerStep(FLOW_NAME, templateStep02);
  registerStep(FLOW_NAME, templateStep03);
  registerStep(FLOW_NAME, templateStep04);
}

const templateStep01: TemplateStepFn = ({ input, state, log }) => {
  const fn = templateStep01.name;
  const startTime = log.start(fn);

  try {
    const normalized = normalizeFlowInput(
      "templateFlow",
      (input ?? {}) as Partial<TemplateFlowInput>
    ) as TemplateFlowInput;
    const { parameter1, parameter2 } = normalized;

    state.e1 = template1(parameter1, parameter2);

    // NOTE: no `input` in the result; `state` is allowed on `next`
    return { kind: "next", nextStep: "templateStep02", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};
const templateStep02: TemplateStepFn = ({ input, state, log }) => {
  const fn = templateStep02.name;
  const startTime = log.start(fn);
  try {
    const { parameter1, parameter2 } = input;

    state.e2 = template2(parameter1, parameter2);

    return { kind: "next", nextStep: "templateStep03", state };
  } catch (err) {
    log.error(err);
    return { kind: "fail", reason: getErrorMessage(err), retryable: true };
  } finally {
    log.finish(fn, startTime);
  }
};

const templateStep03: TemplateStepFn = ({ input, state, log }) => {
  const fn = templateStep03.name;
  const startTime = log.start(fn);
  try {
    log("Starting templateStep03");
    const { parameter1, parameter2 } = input;
    log("input:", input);
    log("state:", state);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);

    const count = (state.yieldCount ?? 0) + 1;
    state.yieldCount = count;

    // do your poll/work here; set state.ready=true when done
    state.e3 = template3(parameter1, parameter2);

    if (state.ready) {
      return { kind: "next", nextStep: "templateStep04", state };
    }

    if (count >= MAX_YIELD_STEPS) {
      return { kind: "next", nextStep: "templateStep04", state };
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

const templateStep04: TemplateStepFn = ({ input, state, log }) => {
  const fn = templateStep04.name;
  const startTime = log.start(fn);
  try {
    log("Starting templateStep04");
    const { parameter1, parameter2 } = input;
    log("input:", input);
    log("parameter1:", parameter1);
    log("parameter2:", parameter2);
    log("Final totals:", state.totals);

    state.e4 = template4(parameter1, parameter2);

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

function template1(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
function template2(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
function template3(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
function template4(parameter1: string, parameter2: number): string {
  return `${parameter1} ${parameter2}`;
}
