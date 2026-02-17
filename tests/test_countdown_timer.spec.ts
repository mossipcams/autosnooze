// @ts-nocheck -- timer behavior tests use fake clocks/mocked Date.now
/**
 * Tests for countdown sync service.
 */

import { afterEach, describe, expect, test, vi } from 'vitest';
import { startCountdownSync, stopCountdownSync } from '../src/services/countdown-sync.js';

describe('Countdown Sync Service', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('ticks on next second boundary then every second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.250Z'));
    const onTick = vi.fn();

    const state = startCountdownSync(onTick);

    vi.advanceTimersByTime(749);
    expect(onTick).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(2);

    stopCountdownSync(state);
  });

  test('detects drift and schedules resync', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.100Z'));

    const state = startCountdownSync(() => {});

    vi.advanceTimersByTime(900); // first boundary tick + interval start

    // Simulate wall-clock drift while interval is running.
    vi.setSystemTime(new Date('2030-01-01T00:00:02.700Z'));
    vi.advanceTimersByTime(1000); // interval tick, drift correction path

    expect(state.interval).toBeNull();
    expect(state.syncTimeout).not.toBeNull();

    stopCountdownSync(state);
  });

  test('unsubscribe cleanup stops further ticks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.100Z'));
    const onTick = vi.fn();

    const state = startCountdownSync(onTick);
    vi.advanceTimersByTime(900);
    expect(onTick).toHaveBeenCalledTimes(1);

    stopCountdownSync(state);
    expect(state.interval).toBeNull();
    expect(state.syncTimeout).toBeNull();

    vi.advanceTimersByTime(5000);
    expect(onTick).toHaveBeenCalledTimes(1);
  });
});
