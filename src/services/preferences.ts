/**
 * Local storage for card preferences that are not tied to a snooze.
 */

import { NOTIFICATION_LEAD_OPTIONS } from '../constants/index.js';
import type { NotificationTrigger } from '../types/automation.js';

const STORAGE_KEY = 'autosnooze_notification_preference';
const TRIGGERS: readonly string[] = ['start', 'about_to_end', 'end'];

export interface NotificationPreference {
  trigger: Exclude<NotificationTrigger, 'none'>;
  leadMinutes: number;
}

/** Save the preference, or forget it when `null`. */
export function saveNotificationPreference(preference: NotificationPreference | null): void {
  try {
    if (preference) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage may be unavailable
  }
}

export function loadNotificationPreference(): NotificationPreference | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored) as Partial<NotificationPreference>;
    if (
      typeof data.trigger !== 'string'
      || !TRIGGERS.includes(data.trigger)
      || !(NOTIFICATION_LEAD_OPTIONS as readonly unknown[]).includes(data.leadMinutes)
    ) {
      return null;
    }
    return { trigger: data.trigger, leadMinutes: data.leadMinutes as number };
  } catch {
    return null;
  }
}
