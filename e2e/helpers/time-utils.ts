/**
 * Get a date string for a date N days in the future
 * @param daysAhead Number of days from today
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getFutureDate(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

/**
 * Get a date string for today
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  return getFutureDate(0);
}

/**
 * Get a date string for tomorrow
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getTomorrowDate(): string {
  return getFutureDate(1);
}

/**
 * Get a time string N hours from now
 * @param hoursAhead Number of hours from now
 * @returns Time string (HH:MM)
 */
export function getFutureTime(hoursAhead: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hoursAhead);
  return date.toTimeString().slice(0, 5);
}

/**
 * Get date and time components N hours from now
 * @param hoursAhead Number of hours from now
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM)
 */
export function getFutureDateTime(hoursAhead: number): { date: string; time: string } {
  const date = new Date();
  date.setHours(date.getHours() + hoursAhead);
  return {
    date: date.toISOString().split('T')[0],
    time: date.toTimeString().slice(0, 5),
  };
}

/**
 * Get date and time components for a specific future date and time
 * @param daysAhead Days from today
 * @param hour Hour (0-23)
 * @param minute Minute (0-59)
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM)
 */
export function getScheduleDateTime(
  daysAhead: number,
  hour: number,
  minute: number = 0
): { date: string; time: string } {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, minute, 0, 0);
  return {
    date: date.toISOString().split('T')[0],
    time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
  };
}

/**
 * Get yesterday's date
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getYesterdayDate(): string {
  return getFutureDate(-1);
}
