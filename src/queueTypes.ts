// src/queueTypes.ts
// Keep this file free of any runtime code that could drag in the worker.

import type * as queueConstants from "./queueConstants";

// ────────────────────────────────────────────────────────────
// Enum/type re-exports so callers can depend on a tiny, stable surface.
// ────────────────────────────────────────────────────────────
type _JobKey = keyof typeof queueConstants.FUNCTION_CALLED;
export type JobName = (typeof queueConstants.FUNCTION_CALLED)[_JobKey];

type _StatusKey = keyof typeof queueConstants.STATUS;
export type JobStatus = (typeof queueConstants.STATUS)[_StatusKey];

// ────────────────────────────────────────────────────────────
// Primitives / aliases (use `type`)
// ────────────────────────────────────────────────────────────
type _IsoString = string;

// ────────────────────────────────────────────────────────────
// Object shapes (use `interface`)
// ────────────────────────────────────────────────────────────

/** Map each job name to its parameter shape */
interface _JobParametersMap {
  FIX_SHEET: { sheetName: string };
  FORMAT_SHEET: { sheetName: string };
  TRIM_SHEET: { sheetName: string };
  UPDATE_BALANCES: { sheetName: string; row: number };
  UPDATE_ACCOUNT_BALANCES: { sheetName: string };
}

export type ParamsOf<N extends JobName> = _JobParametersMap[N];

export interface EnqueueOptions {
  /** Higher number = higher priority (default 50) */
  priority?: number;
  /** ISO string or null (default: run immediately) */
  runAt?: string | null;
  /** Max retry attempts if handler throws (default 3) */
  maxAttempts?: number;
  /** Optional dedupe key if you plan to dedupe externally */
  dedupeKey?: string | null;
}

export interface Job {
  id: string;
  jobName: JobName;
  parameters: unknown;
  enqueuedAt: Date;
  priority: number;
  nextRunAt: Date;
  attempts: number;
  status: JobStatus;
  lastError: string;
  workerId: string;
  startedAt?: Date | null;
}

// Handlers are functions, keep as `type` aliases
export type Handler<N extends JobName = JobName> = (
  params: ParamsOf<N>
) => unknown;
export type HandlerMap = { [K in JobName]?: Handler<K> };

// ────────────────────────────────────────────────────────────
// Tuple / column-aligned row (use `type`)
// ────────────────────────────────────────────────────────────

export type JobRow = [
  id: string,
  job_name: JobName,
  json_parameters: string,
  enqueued_at: _IsoString,
  priority: number,
  next_run_at: _IsoString,
  attempts: number,
  status: JobStatus,
  last_error: string,
  worker_id: string,
  started_at: _IsoString | "" // empty until first run
];

/// <reference types="google-apps-script" />

// A stable id for a whole workflow run
type WorkflowId = string;

// Step function contract
export type StepFn = (ctx: StepContext) => StepResult;

// What every step receives
export type StepContext = {
  workflowId: WorkflowId;     // one run across all steps
  workflowName: string;       // e.g., "RecalculateBalances"
  stepName: string;           // e.g., "ScanSheets"
  input: unknown;             // immutable initial input for the workflow
  state: Record<string, any>; // mutable per-step state (cursor, offsets, etc.)
  attempt: number;            // attempt count for this step
  budgetMs: number;           // soft budget per invocation (e.g., 25_000)
  startedAt: number;          // Date.now()
  // utilities
  log: (msg: string, ...args: any[]) => void;
  now: () => number;
};

// Instruction returned by a step
export type StepResult =
  | { kind: "yield"; state: Record<string, any>; delayMs?: number }              // continue same step later
  | { kind: "next"; nextStep: string; state?: Record<string, any>; delayMs?: number } // jump to next step
  | { kind: "complete"; output?: unknown }                                       // workflow done
  | { kind: "fail"; reason: string; retryable?: boolean; delayMs?: number };     // park or dead-letter

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
