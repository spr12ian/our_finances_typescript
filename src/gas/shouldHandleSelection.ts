// shouldHandleSelection.ts
type DebounceCfg = { minMs: number; windowMs: number };
// windowMs reserved for future rolling-window logic
const DEBOUNCE: DebounceCfg = { minMs: 1000, windowMs: 60000 };

export function shouldHandleSelection(sheetName: string): boolean {
  const p = PropertiesService.getUserProperties();
  const now = Date.now();

  let last: { t: number; sheet: string } | null = null;
  const raw = p.getProperty("sel:last");
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

  p.setProperty("sel:last", JSON.stringify({ t: now, sheet: sheetName }));
  return ok;
}
