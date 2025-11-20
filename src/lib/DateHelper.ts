/// <reference types="google-apps-script" />

export namespace DateHelper {
  export const DISPLAY_DATE_FORMAT = "dd MMM yyyy HH:mm:ss";
  /** Default log timezone (handles BST/GMT automatically). */
  export const LOG_TIMEZONE = "Europe/London" as const;

  // Convert a cell value (Date|string|other) into a UTC Date or null using DateHelper rules.
  export function coerceCellToUtcDate(v: unknown): Date | null {
    if (v instanceof Date) return new Date(v.toISOString()); // normalize to UTC instant
    if (typeof v === "string" && v.trim()) {
      // Try ISO first (with Z/offset), then our display format "dd MMM yyyy HH:mm[:ss]"
      const iso = new Date(v);
      if (!isNaN(iso.getTime()) && /[zZ]|[+\-]\d{2}:\d{2}$/.test(v)) return iso;
      const display = DateHelper.parseDisplayToUtc(v);
      return display ?? null;
    }
    return null;
  }

  export function writeUtcNow(
    range: GoogleAppsScript.Spreadsheet.Range
  ): string {
    const isoUtc = new Date().toISOString();
    range.setValue(new Date(isoUtc));
    range.setNumberFormat(DISPLAY_DATE_FORMAT);
    return isoUtc;
  }

  export function writeUtc(
    range: GoogleAppsScript.Spreadsheet.Range,
    date: Date | string | number
  ): string {
    const d = coerceToDate(date);
    const isoUtc = d.toISOString();
    range.setValue(new Date(isoUtc));
    range.setNumberFormat(DISPLAY_DATE_FORMAT);
    return isoUtc;
  }

  export function readUtcString(
    range: GoogleAppsScript.Spreadsheet.Range
  ): string | null {
    const val = range.getValue();
    if (!val) return null;
    if (val instanceof Date) return val.toISOString();
    const s = String(val).trim();
    if (!s) return null;
    const iso = tryToIso(s);
    return iso ?? null;
  }

  export function readUtcDate(
    range: GoogleAppsScript.Spreadsheet.Range
  ): Date | null {
    const iso = readUtcString(range);
    return iso ? new Date(iso) : null;
  }

  /** Format for logs in London time (BST/GMT as appropriate). */
  export function formatForLog(
    date: Date | string,
    tz: string = LOG_TIMEZONE
  ): string {
    const d = coerceToDate(date);
    return Utilities.formatDate(d, tz, DISPLAY_DATE_FORMAT);
  }

  export function parseDisplayToUtc(str: string): Date | null {
    if (!str) return null;
    const s = str.trim();

    const isoDate = tryIsoToDate(s);
    if (isoDate) return isoDate;

    const m =
      /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(
        s
      );
    if (!m) return null;

    const [, ddStr, monStrRaw, yyyyStr, hhStr, mmStr, ssStr] = m;
    const day = parseInt(ddStr, 10);
    const year = parseInt(yyyyStr, 10);
    const hour = parseInt(hhStr, 10);
    const minute = parseInt(mmStr, 10);
    const second = ssStr ? parseInt(ssStr, 10) : 0;

    const monStr = monStrRaw.toLowerCase();
    const month = MONTH_INDEX[monStr as keyof typeof MONTH_INDEX];
    if (month == null) return null;

    if (
      year < 1900 ||
      year > 3000 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59
    )
      return null;

    const d = new Date(Date.UTC(year, month, day, hour, minute, second, 0));
    return isNaN(d.getTime()) ? null : d;
  }

  const MONTH_INDEX = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  } as const;

  function coerceToDate(v: Date | string | number): Date {
    if (v instanceof Date) return new Date(v.toISOString()); // normalize to UTC moment
    if (typeof v === "number") return new Date(new Date(v).toISOString());
    const d = tryIsoToDate(v) ?? parseDisplayToUtc(v);
    if (!d) throw new Error(`Invalid date string: "${v}"`);
    return d;
  }

  function tryIsoToDate(s: string): Date | null {
    const hasUtcHint = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
    if (!hasUtcHint) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function tryToIso(s: string): string | null {
    const dIso = tryIsoToDate(s);
    if (dIso) return dIso.toISOString();
    const dDisp = parseDisplayToUtc(s);
    return dDisp ? dDisp.toISOString() : null;
  }
}
