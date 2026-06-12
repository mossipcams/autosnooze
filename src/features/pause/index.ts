/**
 * Pause feature orchestration for the AutoSnooze card.
 * Builds pause requests and executes them through the backend service seam.
 */

import { localize } from '../../localization/localize.js';
import { saveLastDuration, saveRecentSnoozes, type LastDurationData } from '../../services/storage.js';
import { pauseAutomations } from '../../services/snooze.js';
import type { AutomationItem, NotificationTrigger, ParsedDuration, PauseServiceParams } from '../../types/automation.js';
import type { HassLabel, HomeAssistant } from '../../types/hass.js';
import { combineDateTime } from '../../utils/datetime.js';
import { durationToMinutes } from '../../utils/duration-parsing.js';
import { formatDateTime, formatDuration } from '../../utils/time-formatting.js';
import { appendNotificationTrigger } from '../../utils/notification-trigger-request.js';

const CONFIRM_LABEL = 'autosnooze_confirm';
const CRITICAL_AUTOMATION_TERMS = [
  'alarm',
  'security',
  'siren',
  'lock',
  'smoke',
  'carbon monoxide',
  'co2',
  'leak',
  'flood',
  'fire',
  'gas',
] as const;

interface RunPauseFeatureInput {
  hass: HomeAssistant;
  selected: string[];
  scheduleMode: boolean;
  customDuration: ParsedDuration;
  disableAtDate: string;
  disableAtTime: string;
  resumeAtDate: string;
  resumeAtTime: string;
  forceConfirm?: boolean;
  notificationTrigger?: NotificationTrigger;
  notificationLeadMinutes?: number;
  automations?: AutomationItem[];
  labelRegistry?: Record<string, HassLabel>;
  nowMs?: number;
}

type RunPauseFeatureResult =
  | { status: 'aborted' }
  | { status: 'validation_error'; toastMessage: string }
  | { status: 'confirm_required' }
  | {
      status: 'submitted';
      toastMessage: string;
      lastDuration?: LastDurationData;
    };

type SchedulePauseBuild = {
  request: PauseServiceParams;
  toastMessage: string;
};

type DurationPauseBuild = SchedulePauseBuild & {
  lastDuration: LastDurationData;
};

type ScheduledPauseValidationResult =
  | { status: 'valid' }
  | { status: 'error'; message: string };

function toValidTimeMs(value: string | null): number | null {
  if (!value) return null;
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
  const resumeTime = toValidTimeMs(combineDateTime(input.resumeAtDate, input.resumeAtTime));
  if (resumeTime === null) return { status: 'error', message: 'Resume time is required' };
  if (resumeTime <= input.nowMs) return { status: 'error', message: 'Resume time must be in the future' };
  const disableAt = input.disableAtDate && input.disableAtTime
    ? combineDateTime(input.disableAtDate, input.disableAtTime)
    : null;
  const disableTime = toValidTimeMs(disableAt);
  if ((input.disableAtDate && input.disableAtTime && disableAt === null)
      || (disableTime !== null && disableTime >= resumeTime)) {
    return { status: 'error', message: 'Snooze time must be before resume time' };
  }
  return { status: 'valid' };
}

function validationToast(input: RunPauseFeatureInput, message: string): string {
  if (message === 'Resume time is required') {
    return localize(input.hass, input.resumeAtDate || input.resumeAtTime
      ? 'toast.error.invalid_datetime'
      : 'toast.error.resume_time_required');
  }
  return localize(input.hass, message === 'Resume time must be in the future'
    ? 'toast.error.resume_time_past'
    : 'toast.error.snooze_before_resume');
}

function getConfirmTranslationKey(error: unknown): string | undefined {
  const serviceError = error as { translation_key?: string; data?: { translation_key?: string } };
  return serviceError?.translation_key ?? serviceError?.data?.translation_key;
}

function hasConfirmLabel(
  labels: string[],
  labelRegistry: Record<string, HassLabel>
): boolean {
  return labels.some((labelId) => labelId === CONFIRM_LABEL || labelRegistry[labelId]?.name === CONFIRM_LABEL);
}

function containsCriticalTerm(value: string): boolean {
  return CRITICAL_AUTOMATION_TERMS.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i').test(value);
  });
}

export function requiresPauseConfirmation(input: {
  selected: string[];
  automations: AutomationItem[];
  labelRegistry: Record<string, HassLabel>;
}): boolean {
  const selectedIds = new Set(input.selected);

  return input.automations.some((automation) => {
    if (!selectedIds.has(automation.id)) {
      return false;
    }

    return hasConfirmLabel(automation.labels, input.labelRegistry)
      || containsCriticalTerm(automation.id)
      || containsCriticalTerm(automation.name);
  });
}

function buildSchedulePauseRequest(input: RunPauseFeatureInput): SchedulePauseBuild | null {
  const disableAt = input.disableAtDate && input.disableAtTime
    ? combineDateTime(input.disableAtDate, input.disableAtTime)
    : null;
  const resumeAt = combineDateTime(input.resumeAtDate, input.resumeAtTime);

  if (!resumeAt) {
    return null;
  }

  const request: PauseServiceParams = appendNotificationTrigger(
    {
      entity_id: input.selected,
      resume_at: resumeAt,
      ...(disableAt && { disable_at: disableAt }),
      ...(input.forceConfirm && { confirm: true }),
    },
    input.notificationTrigger,
    input.notificationLeadMinutes,
  );

  const count = input.selected.length;
  const toastMessage = disableAt
    ? (
        count === 1
          ? localize(input.hass, 'toast.success.scheduled_one')
          : localize(input.hass, 'toast.success.scheduled_many', { count })
      )
    : (
        count === 1
          ? localize(input.hass, 'toast.success.snoozed_until_one', {
              time: formatDateTime(resumeAt, input.hass.locale?.language),
            })
          : localize(input.hass, 'toast.success.snoozed_until_many', {
              count,
              time: formatDateTime(resumeAt, input.hass.locale?.language),
            })
      );

  return { request, toastMessage };
}

function buildDurationPauseRequest(input: RunPauseFeatureInput): DurationPauseBuild {
  const { days, hours, minutes } = input.customDuration;
  const totalMinutes = durationToMinutes(input.customDuration);
  const lastDuration: LastDurationData = {
    minutes: totalMinutes,
    duration: input.customDuration,
    timestamp: Date.now(),
  };

  return {
    request: appendNotificationTrigger(
      {
        entity_id: input.selected,
        days,
        hours,
        minutes,
        ...(input.forceConfirm && { confirm: true }),
      },
      input.notificationTrigger,
      input.notificationLeadMinutes,
    ),
    toastMessage:
      input.selected.length === 1
        ? localize(input.hass, 'toast.success.snoozed_for_one', {
            duration: formatDuration(days, hours, minutes),
          })
        : localize(input.hass, 'toast.success.snoozed_for_many', {
            count: input.selected.length,
            duration: formatDuration(days, hours, minutes),
          }),
    lastDuration,
  };
}

function hasLastDuration(built: SchedulePauseBuild | DurationPauseBuild): built is DurationPauseBuild {
  return 'lastDuration' in built;
}

export async function runPauseFeature(input: RunPauseFeatureInput): Promise<RunPauseFeatureResult> {
  if (input.scheduleMode) {
    const validation = validateScheduledPauseInput({
      ...input,
      nowMs: input.nowMs ?? 0,
    });
    if (validation.status === 'error') {
      return { status: 'validation_error', toastMessage: validationToast(input, validation.message) };
    }
  }
  if (!input.forceConfirm && input.automations && requiresPauseConfirmation({
    selected: input.selected,
    automations: input.automations,
    labelRegistry: input.labelRegistry ?? {},
  })) {
    return { status: 'confirm_required' };
  }
  const built = input.scheduleMode
    ? buildSchedulePauseRequest(input)
    : buildDurationPauseRequest(input);

  if (!built) {
    return { status: 'aborted' };
  }

  try {
    await pauseAutomations(input.hass, built.request);
  } catch (error) {
    if (getConfirmTranslationKey(error) === 'confirm_required') {
      return { status: 'confirm_required' };
    }
    throw error;
  }

  saveRecentSnoozes(input.selected);

  if (hasLastDuration(built)) {
    saveLastDuration(built.lastDuration.duration, built.lastDuration.minutes);
    return {
      status: 'submitted',
      toastMessage: built.toastMessage,
      lastDuration: built.lastDuration,
    };
  }

  return {
    status: 'submitted',
    toastMessage: built.toastMessage,
  };
}
