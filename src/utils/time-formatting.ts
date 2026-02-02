/**
 * Time formatting utilities for AutoSnooze card.
 */

import { TIME_MS } from '../constants/index.js';

/**
 * Format an ISO datetime string for display.
 * Shows year only if the date is in a different year.
 */
export function formatDateTime(isoString: string, locale?: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isNextYear = date.getFullYear() > now.getFullYear();

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  if (isNextYear) {
    options.year = 'numeric';
  }

  return date.toLocaleString(locale, options);
}

/**
 * Format a countdown string for the given resume time.
 * Returns "Resuming..." if the time has passed.
 */
export function formatCountdown(resumeAt: string, fallbackExpired: string = 'Resuming...'): string {
  const diff = new Date(resumeAt).getTime() - Date.now();
  if (diff <= 0) return fallbackExpired;

  const d = Math.floor(diff / TIME_MS.DAY);
  const h = Math.floor((diff % TIME_MS.DAY) / TIME_MS.HOUR);
  const m = Math.floor((diff % TIME_MS.HOUR) / TIME_MS.MINUTE);
  const s = Math.floor((diff % TIME_MS.MINUTE) / TIME_MS.SECOND);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

/**
 * Format a duration as a human-readable string.
 * Example: "1 day, 2 hours, 30 minutes"
 */
export function formatDuration(days: number, hours: number, minutes: number): string {
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  return parts.join(', ');
}

/**
 * Format a duration as a short string (e.g., "1d 2h 30m").
 */
export function formatDurationShort(days: number, hours: number, minutes: number): string {
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.join(' ') || '0m';
}
