// shouldHandleSelection.ts
import { ONE_MINUTE_MS, ONE_SECOND_MS } from "@lib/index";

// windowMs reserved for future rolling-window logic
const DEBOUNCE: DebounceCfg = { minMs: ONE_SECOND_MS, windowMs: ONE_MINUTE_MS };
const USER_SELECTION_STATE_KEY = "sel:last";

type DebounceCfg = { minMs: number; windowMs: number };

export function shouldHandleSelection(sheetName: string): boolean {
  const p = PropertiesService.getUserProperties();
  const now = Date.now();

  let last: { t: number; sheet: string } | null = null;
  const raw = p.getProperty(USER_SELECTION_STATE_KEY);
  if (raw) {
    try {
      last = JSON.parse(raw);
    } catch {
      // ignore corrupt value
    }
  }

  // proceed if different sheet OR user paused long enough
  const ok =
    !last || last.sheet !== sheetName || now - (last.t || 0) >= DEBOUNCE.minMs;

  p.setProperty(USER_SELECTION_STATE_KEY, JSON.stringify({ t: now, sheet: sheetName }));
  return ok;
}
