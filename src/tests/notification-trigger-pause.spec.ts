import { beforeEach, describe, expect, test } from 'vitest';
import { vi } from 'vitest';

vi.mock('../services/snooze.js', () => ({
  pauseAutomations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/storage.js', () => ({
  saveLastDuration: vi.fn(),
  loadLastDuration: vi.fn().mockReturnValue(null),
  clearLastDuration: vi.fn(),
  saveRecentSnoozes: vi.fn(),
  loadRecentSnoozes: vi.fn().mockReturnValue([]),
}));

import { appendNotificationTrigger } from '../utils/notification-trigger-request.js';
import { runPauseFeature } from '../features/pause/index.js';
import { pauseAutomations } from '../services/snooze.js';
import { combineDateTime } from '../utils/datetime.js';

type HassArg = Parameters<typeof runPauseFeature>[0]['hass'];

const baseInput = () => ({
  hass: { callService: vi.fn(), language: 'en' } as unknown as HassArg,
  selected: ['automation.a'],
  scheduleMode: false,
  customDuration: { days: 0, hours: 1, minutes: 0 },
  disableAtDate: '',
  disableAtTime: '',
  resumeAtDate: '',
  resumeAtTime: '',
});

const durationRequestWithoutNotify = {
  entity_id: ['automation.a'],
  days: 0,
  hours: 1,
  minutes: 0,
} as const;

function lastRequest(): Record<string, unknown> {
  const calls = (pauseAutomations as ReturnType<typeof vi.fn>).mock.calls;
  return calls[calls.length - 1][1] as Record<string, unknown>;
}

describe('appendNotificationTrigger', () => {
  test('returns the same payload for none or undefined', () => {
    const base = { entity_id: ['automation.a'], hours: 1 };

    expect(appendNotificationTrigger(base)).toStrictEqual(base);
    expect(appendNotificationTrigger(base, 'none')).toStrictEqual(base);
    expect(Object.prototype.hasOwnProperty.call(appendNotificationTrigger(base), 'notification_trigger')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(appendNotificationTrigger(base, 'none'), 'notification_trigger')).toBe(false);
  });

  test('adds notification_trigger alone for start and end', () => {
    expect(appendNotificationTrigger({ entity_id: ['automation.a'] }, 'start')).toStrictEqual({
      entity_id: ['automation.a'],
      notification_trigger: 'start',
    });
    expect(appendNotificationTrigger({ entity_id: ['automation.a'] }, 'end')).toStrictEqual({
      entity_id: ['automation.a'],
      notification_trigger: 'end',
    });
  });

  test('never adds lead minutes for non about_to_end triggers', () => {
    expect(
      Object.prototype.hasOwnProperty.call(appendNotificationTrigger({ entity_id: ['a'] }, 'start', 60), 'notification_lead_minutes'),
    ).toBe(false);
    expect(
      Object.prototype.hasOwnProperty.call(appendNotificationTrigger({ entity_id: ['a'] }, 'end', 60), 'notification_lead_minutes'),
    ).toBe(false);
  });

  test('adds both fields for about_to_end with a lead', () => {
    expect(appendNotificationTrigger({ entity_id: ['automation.a'] }, 'about_to_end', 60)).toStrictEqual({
      entity_id: ['automation.a'],
      notification_trigger: 'about_to_end',
      notification_lead_minutes: 60,
    });
  });
});

describe('runPauseFeature threads notification trigger config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('duration request carries trigger and lead for about_to_end', async () => {
    await runPauseFeature({
      ...baseInput(),
      notificationTrigger: 'about_to_end',
      notificationLeadMinutes: 120,
    });

    expect(lastRequest()).toStrictEqual({
      ...durationRequestWithoutNotify,
      notification_trigger: 'about_to_end',
      notification_lead_minutes: 120,
    });
  });

  test('duration request carries trigger only for end', async () => {
    await runPauseFeature({ ...baseInput(), notificationTrigger: 'end' });

    expect(lastRequest()).toStrictEqual({
      ...durationRequestWithoutNotify,
      notification_trigger: 'end',
    });
    expect(Object.prototype.hasOwnProperty.call(lastRequest(), 'notification_lead_minutes')).toBe(false);
  });

  test('scheduled request carries trigger and lead for about_to_end', async () => {
    const resumeAt = combineDateTime('2026-12-01', '10:00');
    expect(resumeAt).not.toBeNull();

    await runPauseFeature({
      ...baseInput(),
      scheduleMode: true,
      resumeAtDate: '2026-12-01',
      resumeAtTime: '10:00',
      notificationTrigger: 'about_to_end',
      notificationLeadMinutes: 30,
    });

    expect(lastRequest()).toStrictEqual({
      entity_id: ['automation.a'],
      resume_at: resumeAt,
      notification_trigger: 'about_to_end',
      notification_lead_minutes: 30,
    });
  });

  test.each([
    ['default (undefined)', baseInput()],
    ['explicit none', { ...baseInput(), notificationTrigger: 'none' as const }],
  ] as const)('duration request omits notification fields when %s', async (_label, input) => {
    await runPauseFeature(input);

    expect(lastRequest()).toStrictEqual({ ...durationRequestWithoutNotify });
    expect(Object.prototype.hasOwnProperty.call(lastRequest(), 'notification_trigger')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(lastRequest(), 'notification_lead_minutes')).toBe(false);
  });

  test('successive pauses can change the trigger', async () => {
    await runPauseFeature(baseInput());
    expect(lastRequest()).toStrictEqual({ ...durationRequestWithoutNotify });

    await runPauseFeature({ ...baseInput(), notificationTrigger: 'start' });
    expect(lastRequest()).toStrictEqual({
      ...durationRequestWithoutNotify,
      notification_trigger: 'start',
    });
    expect(pauseAutomations).toHaveBeenCalledTimes(2);
  });
});
