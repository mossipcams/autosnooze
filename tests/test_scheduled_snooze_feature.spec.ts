// @ts-nocheck -- focused seam tests for scheduled snooze delegation
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/features/pause/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/pause/index.js')>();
  return {
    ...actual,
    runPauseFeature: vi.fn(),
  };
});

vi.mock('../src/features/scheduled-snooze/index.js', () => ({
  validateScheduledPauseInput: vi.fn(),
  runAdjustFeature: vi.fn(),
  runCancelScheduledFeature: vi.fn(),
}));

import '../src/index.ts';
import { runPauseFeature } from '../src/features/pause/index.js';
import {
  runAdjustFeature,
  runCancelScheduledFeature,
  validateScheduledPauseInput,
} from '../src/features/scheduled-snooze/index.js';

describe('Scheduled Snooze Feature Delegation', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  test('delegates schedule-mode validation before attempting a pause', async () => {
    validateScheduledPauseInput.mockReturnValue({
      status: 'error',
      message: 'Schedule invalid',
    });

    card._selected = ['automation.test'];
    card._scheduleMode = true;
    card._disableAtDate = '2026-01-15';
    card._disableAtTime = '13:00';
    card._resumeAtDate = '2026-01-15';
    card._resumeAtTime = '12:00';

    await card._snooze();

    expect(validateScheduledPauseInput).toHaveBeenCalledWith({
      disableAtDate: '2026-01-15',
      disableAtTime: '13:00',
      resumeAtDate: '2026-01-15',
      resumeAtTime: '12:00',
      nowMs: expect.any(Number),
    });
    expect(runPauseFeature).not.toHaveBeenCalled();
  });

  test('delegates cancel-scheduled execution to the scheduled snooze feature', async () => {
    runCancelScheduledFeature.mockResolvedValue(undefined);

    await card._cancelScheduled('automation.test');

    expect(runCancelScheduledFeature).toHaveBeenCalledWith(mockHass, 'automation.test');
  });

  test('delegates adjust execution and optimistic resume calculation to the scheduled snooze feature', async () => {
    runAdjustFeature.mockResolvedValue({
      nextResumeAt: '2026-01-15T12:15:00.000Z',
    });

    card._adjustModalResumeAt = '2026-01-15T12:00:00.000Z';

    await card._handleAdjustTimeEvent(new CustomEvent('adjust-time', {
      detail: { entityIds: ['automation.test'], minutes: 15 },
    }));

    expect(runAdjustFeature).toHaveBeenCalledWith(mockHass, {
      entityId: undefined,
      entityIds: ['automation.test'],
      days: undefined,
      hours: undefined,
      minutes: 15,
    }, '2026-01-15T12:00:00.000Z');
    expect(card._adjustModalResumeAt).toBe('2026-01-15T12:15:00.000Z');
  });
});
