import { beforeEach, describe, expect, test, vi } from 'vitest';

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

import { runPauseFeature } from '../features/pause/index.js';
import { pauseAutomations } from '../services/snooze.js';

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

function lastRequest(): Record<string, unknown> {
  const calls = (pauseAutomations as ReturnType<typeof vi.fn>).mock.calls;
  return calls[calls.length - 1][1] as Record<string, unknown>;
}

describe('runPauseFeature threads notify_on_resume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('duration request includes notify_on_resume when enabled', async () => {
    await runPauseFeature({ ...baseInput(), notifyOnResume: true });

    expect(lastRequest()).toMatchObject({ notify_on_resume: true });
  });

  test('scheduled request includes notify_on_resume when enabled', async () => {
    await runPauseFeature({
      ...baseInput(),
      scheduleMode: true,
      resumeAtDate: '2026-12-01',
      resumeAtTime: '10:00',
      notifyOnResume: true,
    });

    expect(lastRequest()).toMatchObject({ notify_on_resume: true });
  });

  test('omits notify_on_resume by default (off)', async () => {
    await runPauseFeature(baseInput());

    expect(lastRequest()).not.toHaveProperty('notify_on_resume');
  });

  test('omits notify_on_resume when explicitly disabled', async () => {
    await runPauseFeature({ ...baseInput(), notifyOnResume: false });

    expect(lastRequest()).not.toHaveProperty('notify_on_resume');
  });
});
