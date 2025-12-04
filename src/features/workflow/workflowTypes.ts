// @workflow/workflowTypes.ts
import type { StepLogger } from "@logging/workflowLogger";
import type { QueueId } from "@queue";

// Engine-only meta that is NOT serialized
export type EngineMeta = {
  attempt: number; // sheet-derived, injected by worker
  // You could add: queueRow?: number, budgetMs?: number, etc.
};

// What actually gets serialized into PAYLOAD
export type SerializedRunStepParameters = {
  queueId: QueueId;
  workflowName: string;
  stepName: string;
  input?: unknown;
  state?: Record<string, any>;
};

// A runnable unit the queue knows about (payload + meta)
export type RunStepJob = SerializedRunStepParameters & EngineMeta;

// Generic step context (what each step sees)
export type StepContext<
  TInput = unknown,
  TState = Record<string, any>
> = {
  queueId: QueueId;              // one run across all steps
  workflowName: string;          // e.g., "templateFlow"
  stepName: string;              // e.g., "templateStep01"
  input: TInput;                 // strongly-typed per flow
  state: TState;                 // mutable per-step state
  attempt: number;               // attempt count for this step
  budgetMs: number;              // soft budget per invocation (e.g., 25 seconds)
  startedAt: number;             // Date.now()
  log: StepLogger;
  now: () => number;
};

// Step function contract (generic)
export type StepFn<
  TInput = unknown,
  TState = Record<string, any>
> = (ctx: StepContext<TInput, TState>) => StepResult;

// Instruction returned by a step
export type StepResult =
  | { kind: "complete"; output?: unknown } // workflow done
  | { kind: "fail"; reason: string; retryable: boolean; delayMs?: number }
  | {
      kind: "next";
      nextStep: string;
      state?: Record<string, any>;
      delayMs?: number;
    }
  | { kind: "yield"; state?: Record<string, any>; delayMs?: number };
