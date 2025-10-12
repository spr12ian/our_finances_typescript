// src/queueTypes.ts
// Keep this file free of any runtime code that could drag in the worker.

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
}

export interface Job {
  id: string;
  payload: unknown;
  enqueuedAt: Date;
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
  id: string,
  payload: string,
  enqueued_at: Date,
  priority: number,
  next_run_at: Date | "",
  attempts: number,
  status: JobStatus,
  last_error: string,
  worker_id: string,
  started_at: Date | "" // empty until first run
];
