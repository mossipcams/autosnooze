/**
 * Local storage service for persisting user preferences.
 */

import type { ParsedDuration } from '../types/automation.js';

const STORAGE_KEY = 'autosnooze_last_duration';

/**
 * Data structure for storing the last used duration.
 */
export interface LastDurationData {
  minutes: number;
  duration: ParsedDuration;
  timestamp: number;
}

/**
 * Save the last used duration to localStorage.
 */
export function saveLastDuration(
  duration: ParsedDuration,
  totalMinutes: number
): void {
  try {
    const data: LastDurationData = {
      minutes: totalMinutes,
      duration,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded, etc.)
  }
}

/**
 * Load the last used duration from localStorage.
 * Returns null if not found or invalid.
 */
export function loadLastDuration(): LastDurationData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as LastDurationData;

    // Validate structure
    if (
      typeof data.minutes !== 'number' ||
      typeof data.duration?.days !== 'number' ||
      typeof data.duration?.hours !== 'number' ||
      typeof data.duration?.minutes !== 'number'
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Clear the last duration from localStorage.
 */
export function clearLastDuration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}
