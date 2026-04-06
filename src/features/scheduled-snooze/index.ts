/**
 * Scheduled snooze feature orchestration and validation helpers.
 */

import { runAdjustAction, runCancelScheduledAction } from '../../components/autosnooze-actions-controller.js';
import type { HomeAssistant } from '../../types/hass.js';
import { combineDateTime } from '../../utils/datetime.js';

type ScheduledPauseValidationResult =
  | { status: 'valid' }
  | { status: 'error'; message: string };

export function validateScheduledPauseInput(input: {
  disableAtDate: string;
  disableAtTime: string;
  resumeAtDate: string;
  resumeAtTime: string;
  nowMs: number;
}): ScheduledPauseValidationResult {
  const resumeAt = combineDateTime(input.resumeAtDate, input.resumeAtTime);

  if (!resumeAt) {
    return { status: 'error', message: 'Resume time is required' };
  }

  const resumeTime = new Date(resumeAt).getTime();
  if (resumeTime <= input.nowMs) {
    return { status: 'error', message: 'Resume time must be in the future' };
  }

  const disableAt = input.disableAtDate && input.disableAtTime
    ? combineDateTime(input.disableAtDate, input.disableAtTime)
    : null;

  if (disableAt) {
    const disableTime = new Date(disableAt).getTime();
    if (disableTime >= resumeTime) {
      return { status: 'error', message: 'Snooze time must be before resume time' };
    }
  }

  return { status: 'valid' };
}

export async function runCancelScheduledFeature(hass: HomeAssistant, entityId: string): Promise<void> {
  await runCancelScheduledAction(hass, entityId);
}

export async function runAdjustFeature(
  hass: HomeAssistant,
  detail: { entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number },
  currentResumeAt: string
): Promise<{ nextResumeAt: string }> {
  const { entityId, entityIds, ...params } = detail;
  const target = entityIds || entityId || '';

  await runAdjustAction(hass, target, params);

  const deltaMs =
    ((params.days || 0) * 24 * 60 * 60 * 1000) +
    ((params.hours || 0) * 60 * 60 * 1000) +
    ((params.minutes || 0) * 60 * 1000);

  const nextResumeAt = new Date(new Date(currentResumeAt).getTime() + deltaMs).toISOString();
  return { nextResumeAt };
}
