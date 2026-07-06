/**
 * Datetime utilities for AutoSnooze card.
 */

interface DateOption {
  value: string; // YYYY-MM-DD
  label: string; // Human-readable label
}

/**
 * Combine date and time strings into an ISO datetime string with local timezone offset.
 * Returns null if date or time is missing/empty.
 */
export function combineDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const localDate = new Date(`${date}T${time}`);
  if (Number.isNaN(localDate.getTime())) {
    return null;
  }

  const parsedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
  const parsedTime = `${String(localDate.getHours()).padStart(2, '0')}:${String(localDate.getMinutes()).padStart(2, '0')}`;
  if (parsedDate !== date || parsedTime !== time) {
    return null;
  }

  const tzOffsetMinutes = localDate.getTimezoneOffset();
  const offsetSign = tzOffsetMinutes <= 0 ? '+' : '-';
  const absMinutes = Math.abs(tzOffsetMinutes);
  const offsetHours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
  const offsetMins = String(absMinutes % 60).padStart(2, '0');
  const offsetStr = `${offsetSign}${offsetHours}:${offsetMins}`;
  return `${date}T${time}${offsetStr}`;
}

/**
 * Return the next calendar day at the given local hour as date/time strings
 * compatible with combineDateTime (YYYY-MM-DD and HH:00).
 */
export function getNextMorningFields(now: Date, hour: number): { date: string; time: string } {
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    hour,
    0,
  );
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${String(hour).padStart(2, '0')}:00`,
  };
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
