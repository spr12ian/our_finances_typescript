export function asNumber(value: unknown, fallback: number | null = null): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  // Reject booleans, null, undefined, objects, arrays, etc.
  return fallback;
}
