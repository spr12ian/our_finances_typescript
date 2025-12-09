// @workflow/workflowRegistry.ts
import type { StepFn } from "./workflowTypes";

// const WORKFLOWS: Record<string, Record<string, StepFn>> = Object.create(null);
const stepRegistry = new Map<string, StepFn<any, any>>();

export function getStep(
  workflowName: string,
  stepName: string
): StepFn<any, any> {
  const step = stepRegistry.get(`${workflowName}.${stepName}`);
  if (!step) {
    throw new Error(`Unknown step: ${workflowName}.${stepName}`);
  }
  return step;
}

export function registerStep<TInput = unknown, TState = Record<string, any>>(
  workflowName: string,
  stepFn: StepFn<TInput, TState>
): void {
  stepRegistry.set(
    `${workflowName}.${stepFn.name}`,
    stepFn as StepFn<any, any>
  );
}
