// import { LOCALE } from "./constants";
import { getOrdinal } from "./number";

// Dates in cells should be in UTC (Z) to avoid timezone issues.

// Standard display format for dates in logs and UI (Google Sheets cells).
// user-friendly, not easily sortable or parseable
// e.g., 25 Dec 2023 14:30:00
// N.B. Google sheets automatically applies timezone conversion in cells
export const DISPLAY_DATE_FORMAT = "dd MMM yyyy HH:mm:ss";



// Convenience shorthands
export const formatLondonDate = (x: DateInput) => formatInTZ(x); // uses defaults above

export const formatLondonDateTime = (x: DateInput) =>
  formatInTZ(x, {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const LOCALE = "en-GB" as const;
const LONDON_TZ = "Europe/London" as const;

export type DayInfo = {
  date: Date;
  day: string;
  dayName: string;
  dayOfMonth: number;
  season: string;
};

type DateInput = Date | string | number | null | undefined;

export function cloneDate(date: Date) {
  return new Date(date.getTime());
}

export function getDayNameInTZ(date: Date, timeZone = LONDON_TZ): string {
  const dayName = formatInTZ(date, { weekday: "long" }, timeZone);
  return dayName;
}

export function getDayOfMonth(date: Date): number {
  // Gets the day-of-the-month, using local time.
  return date.getDate();
}

export function getMonthNameInTZ(date: Date, timeZone = LONDON_TZ): string {
  const monthName = formatInTZ(date, { month: "long" }, timeZone);
  return monthName;
}

export function getOrdinalDateTZ(x: DateInput, timeZone = LONDON_TZ) {
  const parts = formatPartsInTZ(
    x,
    { day: "numeric", month: "long", year: "numeric" },
    timeZone
  );
  const day = Number(parts.find((p) => p.type === "day")!.value);
  const month = parts.find((p) => p.type === "month")!.value!;
  const year = parts.find((p) => p.type === "year")!.value!;
  return `${getOrdinal(day)} of ${month} ${year}`;
}

export function getSeasonName(date: Date): string {
  const seasons = ["Winter", "Spring", "Summer", "Autumn"];
  const monthSeasons = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0];
  return seasons[monthSeasons[getMonthIndex(date)]];
}

export function setupDaysIteratorTZ(
  start: Date,
  timeZone = LONDON_TZ
): {
  first: DayInfo;
  iterator: { next(): DayInfo };
} {
  const d = new Date(start);
  const snapshot = () => ({
    date: new Date(d),
    day: formatInTZ(d, {}, timeZone),
    dayName: formatInTZ(d, { weekday: "long" }, timeZone),
    dayOfMonth: Number(
      formatPartsInTZ(d, { day: "numeric" }, timeZone).find(
        (p) => p.type === "day"
      )!.value
    ),
    season: getSeasonName(d), // or compute via parts if you want strict tz
  });
  return {
    first: snapshot(),
    iterator: {
      next: () => {
        d.setDate(d.getDate() + 1);
        return snapshot();
      },
    },
  };
}

// Local helper functions

// Format in a specific time zone (default: Europe/London)
function formatInTZ(
  x: DateInput,
  options?: Intl.DateTimeFormatOptions,
  timeZone: string = LONDON_TZ
): string {
  const d = toDateSafe(x);
  // Merge with your defaults if you like
  const fmt = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    ...{
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
    ...options,
  });
  return fmt.format(d);
}

// If you want parts (useful for custom strings like “Mon 2 Sep, 13:45 BST”)
function formatPartsInTZ(
  x: DateInput,
  options?: Intl.DateTimeFormatOptions,
  timeZone: string = LONDON_TZ
) {
  const d = toDateSafe(x);
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    ...(options ?? {}),
  }).formatToParts(d);
}

function getMonthIndex(date: Date): number {
  return date.getMonth();
}

// ——— core safe parse ———
function toDateSafe(x: DateInput): Date {
  if (x == null) return new Date();
  if (x instanceof Date) return x;

  // support epoch seconds vs ms
  if (typeof x === "number" && x > 0 && x < 1e12) x = x * 1000;

  const d = new Date(x);
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  return safeDate;
}

export function toLocalIsoLike(
  x: DateInput,
  timeZone: string = LONDON_TZ
): string {
  const d = toDateSafe(x);
  // Use a stable, sortable locale (sv-SE) for YYYY-MM-DD HH:mm:ss
  const date = d.toLocaleDateString("sv-SE", { timeZone });
  const time = d.toLocaleTimeString("sv-SE", { timeZone, hour12: false });
  return `${date} ${time}`;
}

export function toLocalIsoLikeWithMs(
  x: DateInput,
  timeZone: string = LONDON_TZ
): string {
  const d = toDateSafe(x);

  // Get date and time parts in stable format
  const date = d.toLocaleDateString("sv-SE", { timeZone });
  const timeParts = d
    .toLocaleTimeString("sv-SE", {
      timeZone,
      hour12: false,
    })
    .split(":");

  // Extract milliseconds using Intl.DateTimeFormat
  const ms =
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      fractionalSecondDigits: 3,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(d)
      .find((p) => p.type === "fractionalSecond")?.value ?? "000";

  return `${date} ${timeParts.join(":")}.${ms}`;
}
