/**
 * Scheduled snooze feature orchestration and validation helpers.
 */

import { adjustSnooze, cancelScheduled } from '../../services/snooze.js';
import type { HomeAssistant } from '../../types/hass.js';
import { combineDateTime } from '../../utils/datetime.js';

export type ScheduledPauseValidationErrorCode =
  | 'resume_time_required'
  | 'resume_time_past'
  | 'disable_before_resume';

export type ScheduledPauseValidationResult =
  | { status: 'valid' }
  | { status: 'error'; code: ScheduledPauseValidationErrorCode; message: string };

const VALIDATION_ERROR_MESSAGES: Record<ScheduledPauseValidationErrorCode, string> = {
  resume_time_required: 'Resume time is required',
  resume_time_past: 'Resume time must be in the future',
  disable_before_resume: 'Snooze time must be before resume time',
};

function validationError(code: ScheduledPauseValidationErrorCode): ScheduledPauseValidationResult {
  const result = { status: 'error' as const, message: VALIDATION_ERROR_MESSAGES[code] };
  Object.defineProperty(result, 'code', { value: code, enumerable: false });
  return result as ScheduledPauseValidationResult;
}

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
    return validationError('resume_time_required');
  }

  if (resumeTime <= input.nowMs) {
    return validationError('resume_time_past');
  }

  const disableAt = input.disableAtDate && input.disableAtTime
    ? combineDateTime(input.disableAtDate, input.disableAtTime)
    : null;

  if (input.disableAtDate && input.disableAtTime && disableAt === null) {
    return validationError('disable_before_resume');
  }

  if (disableAt) {
    const disableTime = toValidTimeMs(disableAt);
    if (disableTime === null) {
      return validationError('disable_before_resume');
    }
    if (disableTime >= resumeTime) {
      return validationError('disable_before_resume');
    }
  }

  return { status: 'valid' };
}

export async function runCancelScheduledFeature(hass: HomeAssistant, entityId: string): Promise<void> {
  await cancelScheduled(hass, entityId);
}

export async function runCancelScheduledActionFeature(
  hass: HomeAssistant,
  entityId: string,
): Promise<void> {
  await runCancelScheduledFeature(hass, entityId);
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

export async function runAdjustActionFeature(
  hass: HomeAssistant,
  entityId: string | string[],
  params: { days?: number; hours?: number; minutes?: number },
): Promise<void> {
  await adjustSnooze(hass, entityId, params);
}
