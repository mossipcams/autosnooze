import { afterEach, describe, expect, test, vi } from 'vitest';
import { getNextMorningFields } from '../utils/datetime.js';
import { UNTIL_TOMORROW_HOUR } from '../constants/index.js';

describe('getNextMorningFields', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns next calendar day at the given hour with zero-padded date and time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 12, 30, 0));

    expect(getNextMorningFields(new Date(), 8)).toEqual({
      date: '2026-04-30',
      time: '08:00',
    });
  });

  test('rolls over month and year boundaries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 23, 0, 0));

    expect(getNextMorningFields(new Date(), UNTIL_TOMORROW_HOUR)).toEqual({
      date: '2026-02-01',
      time: '08:00',
    });

    vi.setSystemTime(new Date(2026, 11, 31, 15, 0, 0));

    expect(getNextMorningFields(new Date(), UNTIL_TOMORROW_HOUR)).toEqual({
      date: '2027-01-01',
      time: '08:00',
    });
  });

  test('zero-pads single-digit months and days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 8, 9, 0, 0));

    expect(getNextMorningFields(new Date(), 8)).toEqual({
      date: '2026-09-09',
      time: '08:00',
    });
  });
});
