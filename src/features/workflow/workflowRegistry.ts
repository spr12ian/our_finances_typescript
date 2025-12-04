// @workflow/workflowRegistry.ts
import { FastLog } from '@lib/logging';
import type { StepFn } from "./workflowTypes";

const WORKFLOWS: Record<string, Record<string, StepFn>> = Object.create(null);

export function registerStep<
  TInput = unknown,
  TState = Record<string, any>
>(workflowName: string, step: StepFn<TInput, TState>): void {
  const stepName = step.name;
  if (!WORKFLOWS[workflowName]) WORKFLOWS[workflowName] = Object.create(null);
  WORKFLOWS[workflowName][stepName] = step as StepFn<any, any>;
  FastLog.log(`Registered workflow step ${workflowName}.${stepName}`);
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
