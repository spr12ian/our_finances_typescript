// @workflow/workflowRegistry.ts
import type { StepFn } from "./workflowTypes";

const WORKFLOWS: Record<string, Record<string, StepFn>> = Object.create(null);

export function registerStep(workflowName: string, fn: StepFn): void {
  if (!WORKFLOWS[workflowName]) WORKFLOWS[workflowName] = Object.create(null);
  WORKFLOWS[workflowName][fn.name] = fn;
}

export function getStep(workflowName: string, stepName: string): StepFn | undefined {
  return WORKFLOWS[workflowName]?.[stepName];
}

export function clearWorkflowRegistry(): void {
  for (const k of Object.keys(WORKFLOWS)) delete WORKFLOWS[k];
}

export function listWorkflows(): string[] {
  return Object.keys(WORKFLOWS);
}
