// @workflow/workflowTypes.ts
import type { StepLogger } from "@logging/workflowLogger";

// A stable id for a whole workflow run
export type WorkflowId = string;

// What actually gets serialized into PAYLOAD
export type SerializedRunStepParameters = {
  workflowId: string;
  workflowName: string;
  stepName: string;
  input?: unknown;
  state?: Record<string, any>;
};

// Engine-only meta that is NOT serialized
export type EngineMeta = {
  attempt: number; // sheet-derived, injected by worker
  // You could add: queueRow?: number, budgetMs?: number, etc.
};

// A runnable unit the queue knows about (completely decoupled from step code)
// What runStep receives (payload + meta)
export type RunStepJob = SerializedRunStepParameters & EngineMeta;

// What every step receives, it reads attempt from EngineMeta via RunStepJob
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

// Step function contract
export type StepFn = (ctx: StepContext) => StepResult;
