/**
 * Notification trigger fields for pause service payloads.
 */

import type { NotificationTrigger } from '../types/automation.js';

/**
 * Append notification trigger config to a pause request.
 *
 * - Returns the request unchanged for `none` (or undefined) — no fields sent.
 * - Adds `notification_trigger` for any real trigger.
 * - Adds `notification_lead_minutes` only for `about_to_end` with a valid lead.
 */
export function appendNotificationTrigger<T extends Record<string, unknown>>(
  request: T,
  trigger?: NotificationTrigger,
  leadMinutes?: number,
): T {
  if (!trigger || trigger === 'none') {
    return request;
  }

  if (trigger === 'about_to_end') {
    if (leadMinutes === undefined) {
      return { ...request, notification_trigger: trigger };
    }
    return {
      ...request,
      notification_trigger: trigger,
      notification_lead_minutes: leadMinutes,
    };
  }

  return { ...request, notification_trigger: trigger };
}
