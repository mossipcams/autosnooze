import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  clearLastDuration,
  loadLastDuration,
  loadRecentSnoozes,
  saveLastDuration,
  saveRecentSnoozes,
} from '../services/storage.js';
import type { LastDurationData } from '../services/storage.js';

const LAST_DURATION_KEY = 'autosnooze_last_duration';
const RECENT_SNOOZES_KEY = 'autosnooze_recent_snoozes';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('storage mutation boundaries', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('saveLastDuration stores the exact duration, total minutes, and current timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T12:00:00.000Z'));

    saveLastDuration({ days: 1, hours: 2, minutes: 3 }, 1563);

    expect(JSON.parse(localStorage.getItem(LAST_DURATION_KEY) ?? '{}')).toEqual({
      minutes: 1563,
      duration: { days: 1, hours: 2, minutes: 3 },
      timestamp: Date.now(),
    });
  });

  test('loadLastDuration returns null for missing, empty, malformed, and incomplete records', () => {
    expect(loadLastDuration()).toBeNull();

    localStorage.setItem(LAST_DURATION_KEY, '');
    expect(loadLastDuration()).toBeNull();

    localStorage.setItem(LAST_DURATION_KEY, '{bad json');
    expect(loadLastDuration()).toBeNull();

    localStorage.setItem(
      LAST_DURATION_KEY,
      JSON.stringify({ minutes: 30, duration: undefined, timestamp: Date.now() })
    );
    expect(loadLastDuration()).toBeNull();

    localStorage.setItem(
      LAST_DURATION_KEY,
      JSON.stringify({ minutes: 30, duration: { days: 0, hours: 1, minutes: 0 } })
    );
    expect(loadLastDuration()).toBeNull();
  });

  test('loadLastDuration expires records only after the seven day boundary and clears expired storage', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T12:00:00.000Z'));

    const boundaryRecord: LastDurationData = {
      minutes: 45,
      duration: { days: 0, hours: 0, minutes: 45 },
      timestamp: Date.now() - 7 * DAY_MS,
    };
    localStorage.setItem(LAST_DURATION_KEY, JSON.stringify(boundaryRecord));
    expect(loadLastDuration()).toEqual(boundaryRecord);
    expect(localStorage.getItem(LAST_DURATION_KEY)).not.toBeNull();

    const expiredRecord: LastDurationData = {
      ...boundaryRecord,
      timestamp: Date.now() - 7 * DAY_MS - 1,
    };
    localStorage.setItem(LAST_DURATION_KEY, JSON.stringify(expiredRecord));
    expect(loadLastDuration()).toBeNull();
    expect(localStorage.getItem(LAST_DURATION_KEY)).toBeNull();
  });

  test('clearLastDuration removes only the stored last duration key', () => {
    localStorage.setItem(LAST_DURATION_KEY, 'duration');
    localStorage.setItem(RECENT_SNOOZES_KEY, 'recent');

    clearLastDuration();

    expect(localStorage.getItem(LAST_DURATION_KEY)).toBeNull();
    expect(localStorage.getItem(RECENT_SNOOZES_KEY)).toBe('recent');
  });

  test('loadRecentSnoozes returns an empty list for missing, corrupt, and non-array storage', () => {
    expect(loadRecentSnoozes()).toEqual([]);

    localStorage.setItem(RECENT_SNOOZES_KEY, '{bad json');
    expect(loadRecentSnoozes()).toEqual([]);

    localStorage.setItem(RECENT_SNOOZES_KEY, JSON.stringify({ id: 'automation.not_array' }));
    expect(loadRecentSnoozes()).toEqual([]);
  });

  test('loadRecentSnoozes filters invalid entries and expires records at the thirty day cutoff', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T12:00:00.000Z'));
    const cutoff = Date.now() - 30 * DAY_MS;

    localStorage.setItem(
      RECENT_SNOOZES_KEY,
      JSON.stringify([
        { id: 'automation.fresh', timestamp: Date.now() },
        { id: 'automation.boundary', timestamp: cutoff },
        { id: 'automation.expired', timestamp: cutoff - 1 },
        { id: 12, timestamp: Date.now() },
        { id: 'automation.no_timestamp' },
        { id: 'automation.string_timestamp', timestamp: String(Date.now()) },
      ])
    );

    expect(loadRecentSnoozes()).toEqual(['automation.fresh']);
  });

  test('saveRecentSnoozes moves repeated ids to the front without duplicating existing entries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T12:00:00.000Z'));

    saveRecentSnoozes(['automation.a', 'automation.b']);
    vi.advanceTimersByTime(1000);
    saveRecentSnoozes(['automation.b', 'automation.c']);

    expect(loadRecentSnoozes()).toEqual(['automation.b', 'automation.c', 'automation.a']);
    const stored = JSON.parse(localStorage.getItem(RECENT_SNOOZES_KEY) ?? '[]') as Array<{
      id: string;
      timestamp: number;
    }>;
    expect(stored.map((entry) => entry.id)).toEqual([
      'automation.b',
      'automation.c',
      'automation.a',
    ]);
    expect(new Set(stored.map((entry) => entry.id)).size).toBe(stored.length);
  });

  test('saveRecentSnoozes ignores unavailable localStorage writes', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => saveRecentSnoozes(['automation.a'])).not.toThrow();
    expect(setItemSpy).toHaveBeenCalled();
  });
});
