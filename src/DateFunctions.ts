import { LOCALE } from "./constants";
import { getOrdinal } from "./NumberUtils";



type DateInput = Date | string | number | undefined | null;

// 1) Utility: forbid extra keys on object literals
type Strict<T extends object> = T & Record<Exclude<string, keyof T>, never>;

// 2) Defaults: literal, read-only, and validated against the real type
const DEFAULT_DATE_OPTIONS = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
} as const satisfies Partial<Intl.DateTimeFormatOptions>;

export function cloneDate(date: Date) {
  return new Date(date.getTime());
}

export function getDayName(date: Date): string {
  return date.toLocaleDateString(LOCALE, { weekday: "long" });
}

export function getDayOfMonth(date: Date): number {
  return date.getDate();
}

export function getDtf() {
  return new Intl.DateTimeFormat(LOCALE);
}

// https://developers.google.com/apps-script/reference/utilities/utilities#formatDate(Date,String,String)
export function getFormattedDate(date: Date, timeZone: string, format: string) {
  return Utilities.formatDate(date, timeZone, format);
}

export function getMonthIndex(date: Date): number {
  return date.getMonth();
}

export function getMonthName(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: "long" });
}

export function getNewDate(date?: string): Date {
  return date ? new Date(date) : new Date();
}

export function getOrdinalDate(date: Date): string {
  return `${getOrdinal(getDayOfMonth(date))} of ${getMonthName(
    date
  )} ${date.getFullYear()}`;
}

export function getSeasonName(date: Date): string {
  const seasons = ["Winter", "Spring", "Summer", "Autumn"];
  const monthSeasons = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0];
  return seasons[monthSeasons[getMonthIndex(date)]];
}

// 3) Function: only known Intl.DateTimeFormatOptions keys allowed
export function getToday(
  overrides?: Strict<Partial<Intl.DateTimeFormatOptions>>
): string {
  const options: Intl.DateTimeFormatOptions = {
    ...DEFAULT_DATE_OPTIONS,
    ...overrides,
  };

  const date = new Date();
  try {
    return new Intl.DateTimeFormat(LOCALE, options).format(date);
  } catch {
    return date.toLocaleDateString(LOCALE, options);
  }
}

export function setupDaysIterator(startDate: Date) {
  const getNextResult = (iteratorDate: Date) => {
    const date = new Date(iteratorDate);
    return {
      date,
      day: date.toLocaleDateString(LOCALE),
      dayName: getDayName(date),
      dayOfMonth: getDayOfMonth(date),
      season: getSeasonName(date),
    };
  };

  const iteratorDate = new Date(startDate);
  const first = getNextResult(iteratorDate);

  const iterator = {
    next: () => {
      iteratorDate.setDate(iteratorDate.getDate() + 1);
      return getNextResult(iteratorDate);
    },
  };

  return { first, iterator };
}

function toDateSafe(x: DateInput): Date {
  if (x == null) return new Date();
  if (x instanceof Date) return x;

  // handle epoch seconds vs ms
  if (typeof x === "number" && x > 0 && x < 1e12) x = x * 1000;

  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function toIso_(x: any): string {
  const d = toDateSafe(x);
  return d.toISOString();
}
