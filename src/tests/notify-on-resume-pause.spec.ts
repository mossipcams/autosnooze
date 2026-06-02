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

import { appendNotifyOnResumeFlag } from '../features/pause/notify-on-resume-request.js';
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

describe('appendNotifyOnResumeFlag', () => {
  test('returns the same payload when notify is off or undefined', () => {
    const base = { entity_id: ['automation.a'], hours: 1 };

    expect(appendNotifyOnResumeFlag(base)).toStrictEqual(base);
    expect(appendNotifyOnResumeFlag(base, false)).toStrictEqual(base);
    expect(Object.hasOwn(appendNotifyOnResumeFlag(base), 'notify_on_resume')).toBe(false);
    expect(Object.hasOwn(appendNotifyOnResumeFlag(base, false), 'notify_on_resume')).toBe(false);
  });

  test('adds notify_on_resume: true when enabled', () => {
    expect(appendNotifyOnResumeFlag({ entity_id: ['automation.a'] }, true)).toStrictEqual({
      entity_id: ['automation.a'],
      notify_on_resume: true,
    });
    expect(appendNotifyOnResumeFlag({ entity_id: ['automation.a'] }, true).notify_on_resume).toBe(true);
  });
});

describe('runPauseFeature threads notify_on_resume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('duration request includes notify_on_resume: true when enabled', async () => {
    await runPauseFeature({ ...baseInput(), notifyOnResume: true });

    expect(lastRequest()).toStrictEqual({
      ...durationRequestWithoutNotify,
      notify_on_resume: true,
    });
    expect(lastRequest().notify_on_resume).toBe(true);
  });

  test('scheduled request includes notify_on_resume: true when enabled', async () => {
    const resumeAt = combineDateTime('2026-12-01', '10:00');
    expect(resumeAt).not.toBeNull();

    await runPauseFeature({
      ...baseInput(),
      scheduleMode: true,
      resumeAtDate: '2026-12-01',
      resumeAtTime: '10:00',
      notifyOnResume: true,
    });

    expect(lastRequest()).toStrictEqual({
      entity_id: ['automation.a'],
      resume_at: resumeAt,
      notify_on_resume: true,
    });
    expect(lastRequest().notify_on_resume).toBe(true);
  });

  test('scheduled request with disable_at still adds notify_on_resume when enabled', async () => {
    const disableAt = combineDateTime('2026-12-01', '08:00');
    const resumeAt = combineDateTime('2026-12-01', '10:00');
    expect(disableAt).not.toBeNull();
    expect(resumeAt).not.toBeNull();

    await runPauseFeature({
      ...baseInput(),
      scheduleMode: true,
      disableAtDate: '2026-12-01',
      disableAtTime: '08:00',
      resumeAtDate: '2026-12-01',
      resumeAtTime: '10:00',
      notifyOnResume: true,
    });

    expect(lastRequest()).toStrictEqual({
      entity_id: ['automation.a'],
      disable_at: disableAt,
      resume_at: resumeAt,
      notify_on_resume: true,
    });
  });

  test.each([
    ['default (undefined)', baseInput()],
    ['explicitly false', { ...baseInput(), notifyOnResume: false }],
  ] as const)('duration request omits notify_on_resume when %s', async (_label, input) => {
    await runPauseFeature(input);

    expect(lastRequest()).toStrictEqual({ ...durationRequestWithoutNotify });
    expect(Object.hasOwn(lastRequest(), 'notify_on_resume')).toBe(false);
  });

  test.each([
    ['default (undefined)', baseInput()],
    ['explicitly false', { ...baseInput(), notifyOnResume: false }],
  ] as const)('scheduled request omits notify_on_resume when %s', async (_label, input) => {
    const resumeAt = combineDateTime('2026-12-01', '10:00');
    expect(resumeAt).not.toBeNull();

    await runPauseFeature({
      ...input,
      scheduleMode: true,
      resumeAtDate: '2026-12-01',
      resumeAtTime: '10:00',
    });

    expect(lastRequest()).toStrictEqual({
      entity_id: ['automation.a'],
      resume_at: resumeAt,
    });
    expect(Object.hasOwn(lastRequest(), 'notify_on_resume')).toBe(false);
  });

  test('toggles notify_on_resume off then on across successive pauses', async () => {
    await runPauseFeature(baseInput());
    expect(lastRequest()).toStrictEqual({ ...durationRequestWithoutNotify });

    await runPauseFeature({ ...baseInput(), notifyOnResume: true });
    expect(lastRequest()).toStrictEqual({
      ...durationRequestWithoutNotify,
      notify_on_resume: true,
    });
    expect(pauseAutomations).toHaveBeenCalledTimes(2);
  });
});
