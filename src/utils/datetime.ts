/**
 * Datetime utilities for AutoSnooze card.
 */

export interface DateTimeParts {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export interface DateOption {
  value: string; // YYYY-MM-DD
  label: string; // Human-readable label
}

/**
 * Get current date and time as separate parts.
 */
export function getCurrentDateTime(): DateTimeParts {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

/**
 * Combine date and time strings into an ISO datetime string with local timezone offset.
 * Returns null if date or time is missing/empty.
 */
export function combineDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const localDate = new Date(`${date}T${time}`);
  const tzOffsetMinutes = localDate.getTimezoneOffset();
  const offsetSign = tzOffsetMinutes <= 0 ? '+' : '-';
  const absMinutes = Math.abs(tzOffsetMinutes);
  const offsetHours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
  const offsetMins = String(absMinutes % 60).padStart(2, '0');
  const offsetStr = `${offsetSign}${offsetHours}:${offsetMins}`;
  return `${date}T${time}${offsetStr}`;
}

/**
 * Generate date options for the next N days.
 */
export function generateDateOptions(daysAhead: number = 365, locale?: string): DateOption[] {
  const options: DateOption[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;

    const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
    const monthName = date.toLocaleDateString(locale, { month: 'short' });
    const dayNum = date.getDate();

    // Show year only when different from current year
    const label =
      year !== currentYear
        ? `${dayName}, ${monthName} ${dayNum}, ${year}`
        : `${dayName}, ${monthName} ${dayNum}`;

    options.push({ value: isoDate, label });
  }

  return options;
}

/**
 * Check if a date/time combination is in the past (with optional buffer).
 */
export function isDateTimeInPast(date: string, time: string, bufferMs: number = 0): boolean {
  const dateTime = new Date(`${date}T${time}`);
  return dateTime.getTime() < Date.now() + bufferMs;
}
