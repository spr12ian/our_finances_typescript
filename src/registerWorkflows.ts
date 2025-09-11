import { registerStep } from "./queueStepFunctions";
import type { StepFn } from "./queueStepTypes";

// Call once, e.g., inside onOpen or module top-level
export function registerWorkflows(): void {
  registerWorkflow1();
  registerWorkflow2();
}

function registerWorkflow1(): void {
  // import step implementations here to register them
  // (don't import from jobHandlers to avoid cycles)
  registerStep("Workflow1", "Workflow1Step1", Workflow1Step1);
  registerStep("Workflow1", "Workflow1Step2", Workflow1Step2);
  registerStep("Workflow1", "Workflow1Step3", Workflow1Step3);
}

function registerWorkflow2(): void {
  // import step implementations here to register them
  // (don't import from jobHandlers to avoid cycles)
  registerStep("Workflow2", "Workflow2Step1", Workflow2Step1);
  registerStep("Workflow2", "Workflow2Step2", Workflow2Step2);
  registerStep("Workflow2", "Workflow2Step3", Workflow2Step3);
}

const Workflow1Step1: StepFn = ({ state, log }) => {
  log("Starting Workflow1Step1");
  log("Initial totals:", state.totals);
  return { kind: "next", nextStep: "Workflow1Step2", state };
}

const Workflow1Step2: StepFn = ({ state, log }) => {
  log("Starting Workflow1Step2");
  const totals: Record<string, { credit: number; debit: number }> = state.totals ?? {};
  return { kind: "next", nextStep: "Workflow1Step3", state: { totals } };
}

const Workflow1Step3: StepFn = ({ state, log }) => {
  log("Starting Workflow1Step3");
  log("Final totals:", state.totals);
  return { kind: "complete" };
}

const Workflow2Step1: StepFn = ({ state, log }) => {
  log("Starting Workflow2Step1");
  log("Initial totals:", state.totals);
  return { kind: "next", nextStep: "Workflow2Step2", state };
}

const Workflow2Step2: StepFn = ({ state, log }) => {
  log("Starting Workflow2Step2");
  const totals: Record<string, { credit: number; debit: number }> = state.totals ?? {};
  return { kind: "next", nextStep: "Workflow2Step3", state: { totals } };
}

const Workflow2Step3: StepFn = ({ state, log }) =>  {
  log("Starting Workflow2Step3");
  log("Final totals:", state.totals);
  return { kind: "complete" };
}
