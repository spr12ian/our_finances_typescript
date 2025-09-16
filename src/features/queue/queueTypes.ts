// src/queueTypes.ts
// Keep this file free of any runtime code that could drag in the worker.

import type * as queueConstants from "./queueConstants";

type _StatusKey = keyof typeof queueConstants.STATUS;
export type JobStatus = (typeof queueConstants.STATUS)[_StatusKey];

// ────────────────────────────────────────────────────────────
// Primitives / aliases (use `type`)
// ────────────────────────────────────────────────────────────
type _IsoString = string;

// ────────────────────────────────────────────────────────────
// Object shapes (use `interface`)
// ────────────────────────────────────────────────────────────

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
  json_parameters: unknown;
  enqueuedAt: Date;
  priority: number;
  nextRunAt: Date;
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
