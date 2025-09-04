import * as timeConstants from "./timeConstants";

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
export const Col = {
  ID: 1,
  JOB_NAME: 2,
  JSON_PARAMETERS: 3,
  ENQUEUED_AT: 4,
  PRIORITY: 5,
  NEXT_RUN_AT: 6,
  ATTEMPTS: 7,
  STATUS: 8,
  LAST_ERROR: 9,
  WORKER_ID: 10,
  STARTED_AT: 11,
} as const;

export const HEADERS: string[] = [
  "id",
  "job_name",
  "json_parameters",
  "enqueued_at",
  "priority",
  "next_run_at",
  "attempts",
  "status",
  "last_error",
  "worker_id",
  "started_at",
];

export const FUNCTION_CALLED = {
  UPDATE_BALANCES: "UPDATE_BALANCES",
  UPDATE_ACCOUNT_BALANCES: "UPDATE_ACCOUNT_BALANCES",
} as const;
