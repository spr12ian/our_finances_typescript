// src/lib/programmaticEditGuard.ts
// Robust guard that works even if a run crashes (auto-expires).
// Uses ScriptProperties (available everywhere including triggers).

import { ONE_MINUTE_MS } from "./timeConstants";

const FLAG_KEY = "OF_PROGRAMMATIC_EDIT_FLAG"; // JSON: { count: number, ts: number }
const STALE_MS = 2 * ONE_MINUTE_MS; // auto-expire after 2 minutes (safety)

type Flag = { count: number; ts: number };

function now() {
  return Date.now();
}

function readFlag(): Flag {
  const raw = PropertiesService.getScriptProperties().getProperty(FLAG_KEY);
  if (!raw) return { count: 0, ts: 0 };
  try {
    const f = JSON.parse(raw) as Flag;
    // stale protection (e.g., crashed run never cleared)
    if (!f || typeof f.count !== "number" || now() - (f.ts || 0) > STALE_MS) {
      return { count: 0, ts: 0 };
    }
    return f;
  } catch {
    return { count: 0, ts: 0 };
  }
}

function writeFlag(f: Flag | null) {
  const sp = PropertiesService.getScriptProperties();
  if (!f || f.count <= 0) {
    sp.deleteProperty(FLAG_KEY);
  } else {
    f.ts = now();
    sp.setProperty(FLAG_KEY, JSON.stringify(f));
  }
}

export function isProgrammaticEdit(): boolean {
  const f = readFlag();
  return f.count > 0;
}

export function beginProgrammaticEdit(): void {
  const f = readFlag();
  writeFlag({ count: (f.count || 0) + 1, ts: now() });
}

export function endProgrammaticEdit(): void {
  const f = readFlag();
  const count = Math.max(0, (f.count || 0) - 1);
  writeFlag(count === 0 ? null : { count, ts: now() });
}

/** Convenience wrapper */
export function runAsProgrammaticEdit<T>(label: string, fn: () => T): T {
  Logger.log(`Begin programmatic edit: ${label}`);
  beginProgrammaticEdit();
  try {
    return fn();
  } finally {
    endProgrammaticEdit();
  }
}
