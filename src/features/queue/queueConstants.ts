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
  ID: 1,                    // id: string
  JOB_NAME: 2,              // jobName: JobName
  JSON_PARAMETERS: 3,       // parameters: unknown (JSON string in sheet)
  ENQUEUED_AT: 4,           // enqueuedAt: Date
  PRIORITY: 5,              // priority: number
  NEXT_RUN_AT: 6,           // nextRunAt: Date
  ATTEMPTS: 7,              // attempts: number
  STATUS: 8,                // status: JobStatus
  LAST_ERROR: 9,            // lastError: string
  WORKER_ID: 10,            // workerId: string
  STARTED_AT: 11,           // startedAt?: Date | null
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

// All valid job names must have a correspond GAS function of the same name
// which accepts a single parameter object.
// See queueTypes.ts for parameter shapes.
export const FUNCTION_CALLED = {
  FIX_SHEET: "FIX_SHEET",
  FORMAT_SHEET: "FORMAT_SHEET",
  RUN_STEP: "RUN_STEP",
  TRIM_SHEET: "TRIM_SHEET",
  UPDATE_BALANCES: "UPDATE_BALANCES",
  UPDATE_ACCOUNT_BALANCES: "UPDATE_ACCOUNT_BALANCES",
} as const;

// A single infrastructure job name the queue will dispatch
export const JOB_RUN_STEP = "RUN_STEP" as const;

