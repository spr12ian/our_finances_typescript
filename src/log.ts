/// <reference types="google-apps-script" />

import { FastLog } from './support/FastLog';

// ──────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────
type LogLevel = "none" | "error" | "info" | "warn" | "log";

const DEFAULT_MSG_LEVEL: LogLevel = "info";
const LOG_LEVEL: LogLevel = "log"; // set to "none" in production

const levels: Record<LogLevel, number> = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  log: 4,
};

// ──────────────────────────────────────────
// Logger implementation
// ──────────────────────────────────────────
export function log(levelOrMsg: LogLevel | unknown, ...args: unknown[]): void {
  let level: LogLevel;
  let messageParts: unknown[];

  if (typeof levelOrMsg === "string" && levelOrMsg in levels) {
    // First arg is a valid level
    level = levelOrMsg as LogLevel;
    messageParts = args;
  } else {
    // First arg is actually a message → default to DEFAULT_MSG_LEVEL
    level = DEFAULT_MSG_LEVEL;
    messageParts = [levelOrMsg, ...args];
  }

  if (levels[level] <= levels[LOG_LEVEL]) {
    const ts = new Date().toISOString();
    const prefix = `[${ts}][${level.toUpperCase()}]`;

    FastLog.log(prefix, ...messageParts);
  }
}
