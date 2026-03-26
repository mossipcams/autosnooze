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
