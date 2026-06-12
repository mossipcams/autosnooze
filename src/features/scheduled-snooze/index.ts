/**
 * Scheduled snooze feature orchestration and validation helpers.
 */

import { adjustSnooze, cancelScheduled } from '../../services/snooze.js';
import type { HomeAssistant } from '../../types/hass.js';

export async function runCancelScheduledFeature(hass: HomeAssistant, entityId: string): Promise<void> {
  await cancelScheduled(hass, entityId);
}

export async function runAdjustFeature(
  hass: HomeAssistant,
  detail: { entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number },
  currentResumeAt: string
): Promise<{ nextResumeAt: string }> {
  const { entityId, entityIds, ...params } = detail;
  const target = entityIds || entityId || '';

  await adjustSnooze(hass, target, params);

  const deltaMs =
    ((params.days || 0) * 24 * 60 * 60 * 1000) +
    ((params.hours || 0) * 60 * 60 * 1000) +
    ((params.minutes || 0) * 60 * 1000);

  const nextResumeAt = new Date(new Date(currentResumeAt).getTime() + deltaMs).toISOString();
  return { nextResumeAt };
}
