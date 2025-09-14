// src/queueTypes.ts
// Keep this file free of any runtime code that could drag in the worker.

import type { RunStepJob } from "../workflow/workflowTypes";
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
  RUN_STEP: RunStepJob;
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
