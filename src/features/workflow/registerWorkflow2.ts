import { registerStep } from "./workflowRegistry";
import type { StepFn } from "./workflowTypes";

export function registerWorkflow2(): void {
  // import step implementations here to register them
  registerStep("Workflow2", "Workflow2Step1", Workflow2Step1);
  registerStep("Workflow2", "Workflow2Step2", Workflow2Step2);
  registerStep("Workflow2", "Workflow2Step3", Workflow2Step3);
}

const Workflow2Step1: StepFn = ({ state, log }) => {
  log("Starting Workflow2Step1");
  log("Initial totals:", state.totals);
  return { kind: "next", nextStep: "Workflow2Step2", state };
};

const Workflow2Step2: StepFn = ({ state, log }) => {
  log("Starting Workflow2Step2");
  const totals: Record<string, { credit: number; debit: number }> =
    state.totals ?? {};
  return { kind: "next", nextStep: "Workflow2Step3", state: { totals } };
};

const Workflow2Step3: StepFn = ({ state, log }) => {
  log("Starting Workflow2Step3");
  log("Final totals:", state.totals);
  return { kind: "complete" };
};
