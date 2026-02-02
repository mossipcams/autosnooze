/**
 * Paused/scheduled automation state for AutoSnooze card.
 */

import type { HomeAssistant, PausedAutomationAttribute, ScheduledSnoozeAttribute } from '../types/hass.js';
import type { PauseGroup } from '../types/automation.js';

export const SENSOR_ENTITY_ID = 'sensor.autosnooze_snoozed_automations';

/**
 * Get paused automations from the sensor entity.
 */
export function getPaused(hass: HomeAssistant): Record<string, PausedAutomationAttribute> {
  const entity = hass?.states?.[SENSOR_ENTITY_ID];
  return (entity?.attributes?.paused_automations as Record<string, PausedAutomationAttribute>) ?? {};
}

/**
 * Get scheduled snoozes from the sensor entity.
 */
export function getScheduled(hass: HomeAssistant): Record<string, ScheduledSnoozeAttribute> {
  const entity = hass?.states?.[SENSOR_ENTITY_ID];
  return (entity?.attributes?.scheduled_snoozes as Record<string, ScheduledSnoozeAttribute>) ?? {};
}

/**
 * Get paused automations grouped by resume time.
 */
export function getPausedGroupedByResumeTime(hass: HomeAssistant): PauseGroup[] {
  const paused = getPaused(hass);
  const groups: Record<string, PauseGroup> = {};

  Object.entries(paused).forEach(([id, data]) => {
    const resumeAt = data.resume_at;
    if (!groups[resumeAt]) {
      groups[resumeAt] = {
        resumeAt,
        disableAt: data.disable_at,
        automations: [],
      };
    }
    groups[resumeAt].automations.push({
      entity_id: id,
      friendly_name: data.friendly_name,
      resume_at: data.resume_at,
      paused_at: data.paused_at,
      days: data.days,
      hours: data.hours,
      minutes: data.minutes,
      disable_at: data.disable_at,
    });
  });

  // Sort groups by resume time (earliest first)
  return Object.values(groups).sort(
    (a, b) => new Date(a.resumeAt).getTime() - new Date(b.resumeAt).getTime()
  );
}

