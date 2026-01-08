/**
 * Duration parsing utilities for AutoSnooze card.
 */

import { MINUTES_PER } from '../constants/index.js';
import type { ParsedDuration } from '../types/automation.js';

/**
 * Parse a duration input string supporting decimals.
 * Examples: "1.5h" -> 1h 30m, "2.5d" -> 2d 12h, "1d 2.5h 30m" -> 1d 2h 60m
 * Returns null for invalid input.
 */
export function parseDurationInput(input: string): ParsedDuration | null {
  const cleaned = input.toLowerCase().replace(/\s+/g, '');
  if (!cleaned) return null;

  let totalMinutes = 0;
  let hasValidUnit = false;

  // Match numbers (including decimals) followed by units
  const dayMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*d/);
  const hourMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*m(?!i)/); // 'm' but not 'min' to avoid conflict

  if (dayMatch?.[1]) {
    const dayValue = parseFloat(dayMatch[1]);
    if (isNaN(dayValue) || dayValue < 0) return null;
    totalMinutes += dayValue * MINUTES_PER.DAY;
    hasValidUnit = true;
  }

  if (hourMatch?.[1]) {
    const hourValue = parseFloat(hourMatch[1]);
    if (isNaN(hourValue) || hourValue < 0) return null;
    totalMinutes += hourValue * MINUTES_PER.HOUR;
    hasValidUnit = true;
  }

  if (minMatch?.[1]) {
    const minValue = parseFloat(minMatch[1]);
    if (isNaN(minValue) || minValue < 0) return null;
    totalMinutes += minValue;
    hasValidUnit = true;
  }

  // If no units found, try parsing as plain minutes
  if (!hasValidUnit) {
    const plainNum = parseFloat(cleaned);
    if (!isNaN(plainNum) && plainNum > 0) {
      totalMinutes = plainNum;
    } else {
      return null;
    }
  }

  // Round to nearest minute and validate
  totalMinutes = Math.round(totalMinutes);
  if (totalMinutes <= 0) return null;

  // Normalize into days, hours, minutes
  const days = Math.floor(totalMinutes / MINUTES_PER.DAY);
  const remainingAfterDays = totalMinutes % MINUTES_PER.DAY;
  const hours = Math.floor(remainingAfterDays / MINUTES_PER.HOUR);
  const minutes = remainingAfterDays % MINUTES_PER.HOUR;

  return { days, hours, minutes };
}

/**
 * Check if a duration input string is valid.
 */
export function isDurationValid(input: string): boolean {
  return parseDurationInput(input) !== null;
}

/**
 * Convert a ParsedDuration to total minutes.
 */
export function durationToMinutes(duration: ParsedDuration): number {
  return duration.days * MINUTES_PER.DAY + duration.hours * MINUTES_PER.HOUR + duration.minutes;
}

/**
 * Convert total minutes to a ParsedDuration.
 */
export function minutesToDuration(totalMinutes: number): ParsedDuration {
  const days = Math.floor(totalMinutes / MINUTES_PER.DAY);
  const remainingAfterDays = totalMinutes % MINUTES_PER.DAY;
  const hours = Math.floor(remainingAfterDays / MINUTES_PER.HOUR);
  const minutes = remainingAfterDays % MINUTES_PER.HOUR;
  return { days, hours, minutes };
}
