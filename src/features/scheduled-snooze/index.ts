/**
 * Scheduled snooze feature orchestration and validation helpers.
 */

import { adjustSnooze, cancelScheduled } from '../../services/snooze.js';
import type { HomeAssistant } from '../../types/hass.js';
import { combineDateTime } from '../../utils/datetime.js';

type ScheduledPauseValidationResult =
  | { status: 'valid' }
  | { status: 'error'; message: string };

function toValidTimeMs(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const timeMs = new Date(value).getTime();
  return Number.isFinite(timeMs) ? timeMs : null;
}

export function validateScheduledPauseInput(input: {
  disableAtDate: string;
  disableAtTime: string;
  resumeAtDate: string;
  resumeAtTime: string;
  nowMs: number;
}): ScheduledPauseValidationResult {
  const resumeAt = combineDateTime(input.resumeAtDate, input.resumeAtTime);
  const resumeTime = toValidTimeMs(resumeAt);

  if (resumeTime === null) {
    return { status: 'error', message: 'Resume time is required' };
  }

  if (resumeTime <= input.nowMs) {
    return { status: 'error', message: 'Resume time must be in the future' };
  }

  const disableAt = input.disableAtDate && input.disableAtTime
    ? combineDateTime(input.disableAtDate, input.disableAtTime)
    : null;

  if (input.disableAtDate && input.disableAtTime && disableAt === null) {
    return { status: 'error', message: 'Snooze time must be before resume time' };
  }

  if (disableAt) {
    const disableTime = toValidTimeMs(disableAt);
    if (disableTime === null) {
      return { status: 'error', message: 'Snooze time must be before resume time' };
    }
    if (disableTime >= resumeTime) {
      return { status: 'error', message: 'Snooze time must be before resume time' };
    }
  }

  return { status: 'valid' };
}

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
