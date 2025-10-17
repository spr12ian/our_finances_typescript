import { ONE_SECOND } from './timeConstants';

/** Exponential backoff retry helper */
export function withBackoff<T>(fn: () => T, label: string, retries = 5): T {
  let wait = 250; // ms
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return fn();
    } catch (err) {
      lastErr = err;
      console.warn(`[${label}] attempt ${attempt} failed: ${err}`);
      if (attempt === retries) break;
      Utilities.sleep(wait);
      wait = Math.min(wait * 2, 4 * ONE_SECOND);
    }
  }
  throw new Error(`[${label}] failed after ${retries} retries: ${lastErr}`);
}
