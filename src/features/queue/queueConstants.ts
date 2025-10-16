import * as timeConstants from "@lib/timeConstants";

export const QUEUE_SHEET_NAME = "$Queue"; // hidden operational sheet
export const DEAD_SHEET_NAME = "$QueueDead"; // optional dead‑letter sink

export const MAX_ATTEMPTS = 5; // total tries per job
export const DEFAULT_PRIORITY = 100; // lower number = higher priority
export const DEFAULT_BACKOFF_MS = timeConstants.THIRTY_SECONDS; // 30s base
export const MAX_BACKOFF_MS = timeConstants.THIRTY_MINUTES; // 30m max backoff
export const MAX_BATCH = 6; // jobs per worker run
export const WORKER_BUDGET_MS = 55 * timeConstants.ONE_SECOND; // ms per worker run
export const PRUNE_AFTER_DAYS = 7; // prune DONE/ERROR older than N days

export const STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  DONE: "DONE",
  ERROR: "ERROR",
} as const;

// Column map to avoid magic numbers
export const COL = {
  ID: 1, // id: string
  JSON_PAYLOAD: 2, // parameters: unknown (JSON string in sheet)
  ENQUEUED_AT: 3, // enqueuedAt: Date
  PRIORITY: 4, // priority: number
  NEXT_RUN_AT: 5, // nextRunAt: Date
  ATTEMPTS: 6, // attempts: number
  STATUS: 7, // status: JobStatus
  LAST_ERROR: 8, // lastError: string
  WORKER_ID: 9, // workerId: string
  STARTED_AT: 10, // startedAt?: Date | null
} as const;

export const HEADERS: string[] = [
  "id",
  "payload",
  "enqueued_at",
  "priority",
  "next_run_at",
  "attempts",
  "status",
  "last_error",
  "worker_id",
  "started_at",
];
