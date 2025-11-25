import { ONE_MINUTE_MS, ONE_SECOND_MS } from "@lib/timeConstants";
import { oneBased } from "../../types/oneBased";

export const QUEUE_SHEET_NAME = "$Queue"; // hidden operational sheet
export const DEAD_SHEET_NAME = "$QueueDead"; // optional dead‑letter sink

export const MAX_ATTEMPTS = 5; // total tries per job
export const DEFAULT_PRIORITY = 100; // lower number = higher priority
export const DEFAULT_BACKOFF_MS = 30 * ONE_SECOND_MS; // 30s base
export const MAX_BACKOFF_MS = 30 * ONE_MINUTE_MS; // 30m max backoff
export const MAX_BATCH = 6; // jobs per worker run
export const WORKER_BUDGET_MS = 55 * ONE_SECOND_MS; // ms per worker run
export const MOVE_AFTER_DAYS = 5; // Older than N days moved to dead sheet
export const PURGE_AFTER_DAYS = 7; // Purge DONE/ERROR older than N days

export const STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  DONE: "DONE",
  ERROR: "ERROR",
} as const;

export const QUEUE_HEADERS: string[] = [
  "id",
  "queued_at",
  "queued_by",
  "payload",
  "priority",
  "next_run_at",
  "attempts",
  "status",
  "last_error",
  "worker_id",
  "started_at",
] as const;

// Uppercase version
export const HEADERS: string[] = [
  "ID",
  "QUEUED_AT",
  "QUEUED_BY",
  "PAYLOAD",
  "PRIORITY",
  "NEXT_RUN_AT",
  "ATTEMPTS",
  "STATUS",
  "LAST_ERROR",
  "WORKER_ID",
  "STARTED_AT",
] as const;

export const COLUMNS = {
  QUEUE_ID: oneBased(1),
  QUEUED_AT: oneBased(2),
  QUEUED_BY: oneBased(3),
  PAYLOAD: oneBased(4),
  PRIORITY: oneBased(5),
  NEXT_RUN_AT: oneBased(6),
  ATTEMPTS: oneBased(7),
  STATUS: oneBased(8),
  LAST_ERROR: oneBased(9),
  WORKER_ID: oneBased(10),
  STARTED_AT: oneBased(11),
};
