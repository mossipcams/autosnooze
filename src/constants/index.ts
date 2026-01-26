/**
 * Constants for AutoSnooze card.
 */

import type { DurationPreset } from '../types/automation.js';

declare const __VERSION__: string;

/**
 * Card version injected from package.json at build time.
 */
export const CARD_VERSION: string = __VERSION__;

/**
 * Time constants in milliseconds.
 */
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
} as const;

/**
 * Minutes per time unit.
 */
export const MINUTES_PER = {
  HOUR: 60,
  DAY: 1440,
} as const;

/**
 * UI timing constants in milliseconds.
 */
export const UI_TIMING = {
  SEARCH_DEBOUNCE_MS: 300,
  TOAST_FADE_MS: 300,
  WAKE_ALL_CONFIRM_MS: 3000,
  TOAST_DURATION_MS: 5000,
  COUNTDOWN_INTERVAL_MS: 1000,
  TIME_VALIDATION_BUFFER_MS: 5000,
} as const;

/**
 * Default duration presets for the snooze button row.
 */
export const DEFAULT_DURATIONS: DurationPreset[] = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '12h', minutes: 720 },
  { label: '1d', minutes: 1440 },
  { label: 'Custom', minutes: null },
];

/**
 * Default snooze duration in minutes.
 */
export const DEFAULT_SNOOZE_MINUTES = 30;

/**
 * Error translation key to user-friendly message mapping.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  not_automation: 'Failed to snooze: One or more selected items are not automations',
  invalid_duration: 'Failed to snooze: Please specify a valid duration (days, hours, or minutes)',
  resume_time_past: 'Failed to snooze: Resume time must be in the future',
  disable_after_resume: 'Failed to snooze: Snooze time must be before resume time',
};

/**
 * Label for excluding automations from AutoSnooze (blacklist mode).
 */
export const EXCLUDE_LABEL = 'autosnooze_exclude';

/**
 * Label for including automations in AutoSnooze (whitelist mode).
 */
export const INCLUDE_LABEL = 'autosnooze_include';

