import { LOCALE } from "./constants";
import { getOrdinal } from "./NumberUtils";

export function getDayName(date: Date): string {
  return date.toLocaleDateString(LOCALE, { weekday: "long" });
}

export function getDayOfMonth(date: Date): number {
  return date.getDate();
}

// https://developers.google.com/apps-script/reference/utilities/utilities#formatDate(Date,String,String)
export function getFormattedDate(date: Date, timeZone:string, format:string) {
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

export function getToday(
  options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
) {
  const date = new Date();
  let today;

  try {
    const dtf = new Intl.DateTimeFormat(LOCALE, options);
    today = dtf.format(date);
  } catch (error) {
    today = date.toLocaleDateString(LOCALE, options); // Fallback to toLocaleDateString
  }

  return today;
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
