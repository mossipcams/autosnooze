import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../services/snooze.js', () => ({
  pauseAutomations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/storage.js', () => ({
  saveLastDuration: vi.fn(),
  loadLastDuration: vi.fn().mockReturnValue(null),
  saveRecentSnoozes: vi.fn(),
  loadRecentSnoozes: vi.fn().mockReturnValue([]),
}));

import { runPauseFeature } from '../features/pause/index.js';
import { pauseAutomations } from '../services/snooze.js';
import { saveLastDuration } from '../services/storage.js';
import { combineDateTime } from '../utils/datetime.js';

describe('runPauseFeature until-tomorrow normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('synthesizes a resume-only schedule pause at next-day 08:00 local', async () => {
    const hass = { callService: vi.fn(), language: 'en' } as unknown as Parameters<typeof runPauseFeature>[0]['hass'];
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a'],
      scheduleMode: false,
      untilTomorrow: true,
      customDuration: { days: 0, hours: 0, minutes: 30 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '',
      resumeAtTime: '',
      nowMs: Date.now(),
    });

    expect(result.status).toBe('submitted');
    expect(pauseAutomations).toHaveBeenCalledWith(hass, {
      entity_id: ['automation.a'],
      resume_at: combineDateTime('2026-04-30', '08:00'),
    });
  });

  test('does not record a last duration for until-tomorrow pauses', async () => {
    const hass = { callService: vi.fn(), language: 'en' } as unknown as Parameters<typeof runPauseFeature>[0]['hass'];
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a'],
      scheduleMode: false,
      untilTomorrow: true,
      customDuration: { days: 0, hours: 0, minutes: 30 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '',
      resumeAtTime: '',
      nowMs: Date.now(),
    });

    expect(result.status).toBe('submitted');
    expect(saveLastDuration).not.toHaveBeenCalled();
  });

  test('explicit schedule mode wins over the untilTomorrow flag', async () => {
    const hass = { callService: vi.fn(), language: 'en' } as unknown as Parameters<typeof runPauseFeature>[0]['hass'];
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a'],
      scheduleMode: true,
      untilTomorrow: true,
      customDuration: { days: 0, hours: 0, minutes: 30 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '2026-05-02',
      resumeAtTime: '10:30',
      nowMs: Date.now(),
    });

    expect(result.status).toBe('submitted');
    expect(pauseAutomations).toHaveBeenCalledWith(hass, {
      entity_id: ['automation.a'],
      resume_at: combineDateTime('2026-05-02', '10:30'),
    });
  });
});
