// src/queueTypes.ts
// Keep this file free of any runtime code that could drag in the worker.

import type { FlowState } from '@workflow';
import type * as queueConstants from "./queueConstants";

type _StatusKey = keyof typeof queueConstants.STATUS;
export type JobStatus = (typeof queueConstants.STATUS)[_StatusKey];

// ────────────────────────────────────────────────────────────
// Object shapes (use `interface`)
// ────────────────────────────────────────────────────────────

export interface QueueEnqueueOptions {
  /** Higher number = higher priority (default 50) */
  priority?: number;
  /** ISO string or null (default: run immediately) */
  runAt?: Date | null;
  /** Max retry attempts if handler throws (default 3) */
  maxAttempts?: number;
  /** Optional dedupe key if you plan to dedupe externally */
  dedupeKey?: string | null;
  /** Who queued this workflow (GAS_ function name, trigger, etc.) */
  queuedBy?: string;
}

export interface QueueWorkflowOptions {
  /** Initial workflow state (defaults to empty object) */
  initialState?: FlowState;
  /** Queue priority (passed through to enqueueRunStep) */
  priority?: number;
  /** Who queued this workflow (GAS_ function name, trigger, etc.) */
  queuedBy?: string;
}


export interface Job {
  queueId: QueueId;
  queuedAt: Date;
  queuedBy: string;
  payload: unknown;
  priority: number;
  nextRunAt: Date | null;
  attempts: number;
  status: JobStatus;
  lastError: string;
  workerId: string;
  startedAt?: Date | null;
}

// ────────────────────────────────────────────────────────────
// Tuple / column-aligned row (use `type`)
// ────────────────────────────────────────────────────────────

export type JobRow = [
  queue_id: QueueId,
  queued_at: Date,
  queued_by: string,
  payload: string,
  priority: number,
  next_run_at: Date | "",
  attempts: number,
  status: JobStatus,
  last_error: string,
  worker_id: string,
  started_at: Date | "" // empty until first run
];

export type QueueId = string;
