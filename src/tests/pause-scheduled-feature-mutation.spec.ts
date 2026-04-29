import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { HomeAssistant } from '../types/hass.js';

const { pauseAutomationsMock, adjustSnoozeMock, cancelScheduledMock } = vi.hoisted(() => ({
  pauseAutomationsMock: vi.fn(),
  adjustSnoozeMock: vi.fn(),
  cancelScheduledMock: vi.fn(),
}));

const { saveLastDurationMock, saveRecentSnoozesMock } = vi.hoisted(() => ({
  saveLastDurationMock: vi.fn(),
  saveRecentSnoozesMock: vi.fn(),
}));

vi.mock('../services/snooze.js', () => ({
  pauseAutomations: pauseAutomationsMock,
  adjustSnooze: adjustSnoozeMock,
  cancelScheduled: cancelScheduledMock,
}));

vi.mock('../services/storage.js', () => ({
  saveLastDuration: saveLastDurationMock,
  saveRecentSnoozes: saveRecentSnoozesMock,
}));

import {
  requiresPauseConfirmation,
  runPauseActionFeature,
  runPauseFeature,
} from '../features/pause/index.js';
import {
  runAdjustActionFeature,
  runAdjustFeature,
  runCancelScheduledActionFeature,
  runCancelScheduledFeature,
  validateScheduledPauseInput,
} from '../features/scheduled-snooze/index.js';

const hass = {
  locale: { language: 'en' },
  language: 'en',
  callService: vi.fn(),
} as unknown as HomeAssistant;

describe('pause feature mutation boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pauseAutomationsMock.mockResolvedValue(undefined);
  });

  test('requiresPauseConfirmation only inspects selected automations and detects labels and critical terms', () => {
    const automations = [
      {
        id: 'automation.kitchen',
        name: 'Kitchen Lights',
        area_id: null,
        category_id: null,
        labels: ['autosnooze_confirm'],
      },
      {
        id: 'automation.lockdown',
        name: 'Not Selected Lock',
        area_id: null,
        category_id: null,
        labels: [],
      },
      {
        id: 'automation.front_door',
        name: 'Front Door Security',
        area_id: null,
        category_id: null,
        labels: [],
      },
      {
        id: 'automation.flocker',
        name: 'Harmless Flocker',
        area_id: null,
        category_id: null,
        labels: [],
      },
      {
        id: 'automation.labeled',
        name: 'Label Name Match',
        area_id: null,
        category_id: null,
        labels: ['needs_confirm'],
      },
    ];

    expect(
      requiresPauseConfirmation({
        selected: ['automation.kitchen'],
        automations,
        labelRegistry: {},
      })
    ).toBe(true);
    expect(
      requiresPauseConfirmation({
        selected: ['automation.front_door'],
        automations,
        labelRegistry: {},
      })
    ).toBe(true);
    expect(
      requiresPauseConfirmation({
        selected: ['automation.labeled'],
        automations,
        labelRegistry: { needs_confirm: { label_id: 'needs_confirm', name: 'autosnooze_confirm' } },
      })
    ).toBe(true);
    expect(
      requiresPauseConfirmation({
        selected: ['automation.flocker'],
        automations,
        labelRegistry: {},
      })
    ).toBe(false);
  });

  test('runPauseFeature submits duration requests, saves recents and last duration, and returns last duration', async () => {
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a'],
      scheduleMode: false,
      customDuration: { days: 1, hours: 2, minutes: 3 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '',
      resumeAtTime: '',
      forceConfirm: true,
    });

    expect(pauseAutomationsMock).toHaveBeenCalledWith(hass, {
      entity_id: ['automation.a'],
      days: 1,
      hours: 2,
      minutes: 3,
      confirm: true,
    });
    expect(saveRecentSnoozesMock).toHaveBeenCalledWith(['automation.a']);
    expect(saveLastDurationMock).toHaveBeenCalledWith({ days: 1, hours: 2, minutes: 3 }, 1563);
    expect(result).toMatchObject({
      status: 'submitted',
      lastDuration: {
        minutes: 1563,
        duration: { days: 1, hours: 2, minutes: 3 },
      },
    });
    expect(result.status === 'submitted' ? result.toastMessage : '').toContain('1 day');
  });

  test('runPauseFeature uses plural duration toast path for multiple selected automations', async () => {
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a', 'automation.b'],
      scheduleMode: false,
      customDuration: { days: 0, hours: 0, minutes: 30 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '',
      resumeAtTime: '',
    });

    expect(result.status).toBe('submitted');
    expect(result.status === 'submitted' ? result.toastMessage : '').toContain('2');
    expect(pauseAutomationsMock).toHaveBeenCalledWith(hass, {
      entity_id: ['automation.a', 'automation.b'],
      days: 0,
      hours: 0,
      minutes: 30,
    });
  });

  test('runPauseFeature aborts invalid scheduled requests before calling services', async () => {
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a'],
      scheduleMode: true,
      customDuration: { days: 0, hours: 0, minutes: 30 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '',
      resumeAtTime: '12:00',
    });

    expect(result).toEqual({ status: 'aborted' });
    expect(pauseAutomationsMock).not.toHaveBeenCalled();
    expect(saveRecentSnoozesMock).not.toHaveBeenCalled();
    expect(saveLastDurationMock).not.toHaveBeenCalled();
  });

  test('runPauseFeature submits scheduled resume-only requests and does not save last duration', async () => {
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a', 'automation.b'],
      scheduleMode: true,
      customDuration: { days: 0, hours: 0, minutes: 30 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '2026-05-01',
      resumeAtTime: '09:05',
      forceConfirm: true,
    });

    expect(result.status).toBe('submitted');
    expect(result.status === 'submitted' ? result.toastMessage : '').toContain('2');
    expect(pauseAutomationsMock).toHaveBeenCalledWith(hass, {
      entity_id: ['automation.a', 'automation.b'],
      resume_at: expect.stringMatching(/^2026-05-01T09:05[+-]\d{2}:\d{2}$/),
      confirm: true,
    });
    expect(saveRecentSnoozesMock).toHaveBeenCalledWith(['automation.a', 'automation.b']);
    expect(saveLastDurationMock).not.toHaveBeenCalled();
  });

  test('runPauseFeature submits scheduled disable and resume requests through the scheduled toast path', async () => {
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a'],
      scheduleMode: true,
      customDuration: { days: 0, hours: 0, minutes: 30 },
      disableAtDate: '2026-04-30',
      disableAtTime: '08:00',
      resumeAtDate: '2026-04-30',
      resumeAtTime: '09:00',
    });

    expect(result.status).toBe('submitted');
    expect(pauseAutomationsMock).toHaveBeenCalledWith(hass, {
      entity_id: ['automation.a'],
      disable_at: expect.stringMatching(/^2026-04-30T08:00[+-]\d{2}:\d{2}$/),
      resume_at: expect.stringMatching(/^2026-04-30T09:00[+-]\d{2}:\d{2}$/),
    });
  });

  test('runPauseFeature maps confirm-required service errors and rethrows other failures', async () => {
    pauseAutomationsMock.mockRejectedValueOnce({ data: { translation_key: 'confirm_required' } });
    await expect(
      runPauseFeature({
        hass,
        selected: ['automation.a'],
        scheduleMode: false,
        customDuration: { days: 0, hours: 0, minutes: 15 },
        disableAtDate: '',
        disableAtTime: '',
        resumeAtDate: '',
        resumeAtTime: '',
      })
    ).resolves.toEqual({ status: 'confirm_required' });

    const error = new Error('service failed');
    pauseAutomationsMock.mockRejectedValueOnce(error);
    await expect(
      runPauseFeature({
        hass,
        selected: ['automation.a'],
        scheduleMode: false,
        customDuration: { days: 0, hours: 0, minutes: 15 },
        disableAtDate: '',
        disableAtTime: '',
        resumeAtDate: '',
        resumeAtTime: '',
      })
    ).rejects.toThrow(error);
  });

  test('runPauseActionFeature delegates raw pause params unchanged', async () => {
    const params = { entity_id: ['automation.a'], hours: 2, confirm: true };

    await runPauseActionFeature(hass, params);

    expect(pauseAutomationsMock).toHaveBeenCalledWith(hass, params);
  });
});

describe('scheduled snooze feature mutation boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adjustSnoozeMock.mockResolvedValue(undefined);
    cancelScheduledMock.mockResolvedValue(undefined);
  });

  test('validateScheduledPauseInput rejects missing, current, past, invalid, and overlapping times', () => {
    const nowMs = new Date(2026, 3, 29, 12, 0, 0).getTime();

    expect(
      validateScheduledPauseInput({
        disableAtDate: '',
        disableAtTime: '',
        resumeAtDate: '',
        resumeAtTime: '',
        nowMs,
      })
    ).toEqual({ status: 'error', message: 'Resume time is required' });

    expect(
      validateScheduledPauseInput({
        disableAtDate: '',
        disableAtTime: '',
        resumeAtDate: '2026-04-29',
        resumeAtTime: '12:00',
        nowMs,
      })
    ).toEqual({ status: 'error', message: 'Resume time must be in the future' });

    expect(
      validateScheduledPauseInput({
        disableAtDate: '',
        disableAtTime: '',
        resumeAtDate: '2026-04-29',
        resumeAtTime: '11:59',
        nowMs,
      })
    ).toEqual({ status: 'error', message: 'Resume time must be in the future' });

    expect(
      validateScheduledPauseInput({
        disableAtDate: '2026-04-29',
        disableAtTime: '24:61',
        resumeAtDate: '2026-04-29',
        resumeAtTime: '13:00',
        nowMs,
      })
    ).toEqual({ status: 'error', message: 'Snooze time must be before resume time' });

    expect(
      validateScheduledPauseInput({
        disableAtDate: '2026-04-29',
        disableAtTime: '13:00',
        resumeAtDate: '2026-04-29',
        resumeAtTime: '13:00',
        nowMs,
      })
    ).toEqual({ status: 'error', message: 'Snooze time must be before resume time' });
  });

  test('validateScheduledPauseInput accepts future resume times with no disable time or partial disable fields', () => {
    const nowMs = new Date(2026, 3, 29, 12, 0, 0).getTime();

    expect(
      validateScheduledPauseInput({
        disableAtDate: '',
        disableAtTime: '',
        resumeAtDate: '2026-04-29',
        resumeAtTime: '12:01',
        nowMs,
      })
    ).toEqual({ status: 'valid' });

    expect(
      validateScheduledPauseInput({
        disableAtDate: '2026-04-29',
        disableAtTime: '',
        resumeAtDate: '2026-04-29',
        resumeAtTime: '12:01',
        nowMs,
      })
    ).toEqual({ status: 'valid' });
  });

  test('cancel scheduled feature variants delegate entity ids unchanged', async () => {
    await runCancelScheduledFeature(hass, 'automation.a');
    await runCancelScheduledActionFeature(hass, 'automation.b');

    expect(cancelScheduledMock).toHaveBeenNthCalledWith(1, hass, 'automation.a');
    expect(cancelScheduledMock).toHaveBeenNthCalledWith(2, hass, 'automation.b');
  });

  test('runAdjustFeature delegates array targets and calculates day, hour, and minute deltas', async () => {
    const result = await runAdjustFeature(
      hass,
      {
        entityId: 'automation.single',
        entityIds: ['automation.a', 'automation.b'],
        days: 1,
        hours: 2,
        minutes: 3,
      },
      '2026-04-29T12:00:00.000Z'
    );

    expect(adjustSnoozeMock).toHaveBeenCalledWith(
      hass,
      ['automation.a', 'automation.b'],
      { days: 1, hours: 2, minutes: 3 }
    );
    expect(result).toEqual({ nextResumeAt: '2026-04-30T14:03:00.000Z' });
  });

  test('runAdjustFeature supports single targets and zero-default deltas', async () => {
    const result = await runAdjustFeature(
      hass,
      { entityId: 'automation.single', minutes: -15 },
      '2026-04-29T12:00:00.000Z'
    );

    expect(adjustSnoozeMock).toHaveBeenCalledWith(hass, 'automation.single', {
      days: undefined,
      hours: undefined,
      minutes: -15,
    });
    expect(result).toEqual({ nextResumeAt: '2026-04-29T11:45:00.000Z' });
  });

  test('runAdjustFeature falls back to an empty target when no entity is supplied', async () => {
    const result = await runAdjustFeature(hass, { hours: 1 }, '2026-04-29T12:00:00.000Z');

    expect(adjustSnoozeMock).toHaveBeenCalledWith(hass, '', {
      days: undefined,
      hours: 1,
      minutes: undefined,
    });
    expect(result).toEqual({ nextResumeAt: '2026-04-29T13:00:00.000Z' });
  });

  test('runAdjustActionFeature delegates action params unchanged', async () => {
    await runAdjustActionFeature(hass, ['automation.a'], { days: 0, hours: 1, minutes: 30 });

    expect(adjustSnoozeMock).toHaveBeenCalledWith(hass, ['automation.a'], {
      days: 0,
      hours: 1,
      minutes: 30,
    });
  });
});
