// src/workflow/types.ts
import type { StepLogger } from "./logging";

// A stable id for a whole workflow run
export type WorkflowId = string;

// Step function contract
export type StepFn = (ctx: StepContext) => StepResult;

// What every step receives
export type StepContext = {
  workflowId: WorkflowId; // one run across all steps
  workflowName: string; // e.g., "RecalculateBalances"
  stepName: string; // e.g., "ScanSheets"
  input: unknown; // immutable initial input for the workflow
  state: Record<string, any>; // mutable per-step state (cursor, offsets, etc.)
  attempt: number; // attempt count for this step
  budgetMs: number; // soft budget per invocation (e.g., 25 seconds)
  startedAt: number; // Date.now()
  // utilities
  log: StepLogger;
  now: () => number;
};

// Instruction returned by a step
export type StepResult =
  | { kind: "yield"; state: Record<string, any>; delayMs?: number } // continue same step later
  | {
      kind: "next";
      nextStep: string;
      state?: Record<string, any>;
      delayMs?: number;
    } // jump to next step
  | { kind: "complete"; output?: unknown } // workflow done
  | { kind: "fail"; reason: string; retryable?: boolean; delayMs?: number }; // park or dead-letter

// A runnable unit the queue knows about (completely decoupled from your step code)
export type RunStepJob = {
  type: "RUN_STEP";
  workflowId: WorkflowId;
  workflowName: string;
  stepName: string;
  input: unknown;
  state: Record<string, any>;
  attempt: number;
};
