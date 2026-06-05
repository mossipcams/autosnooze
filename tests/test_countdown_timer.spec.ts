// @ts-nocheck -- shared countdown clock contract tests
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getCountdownSubscriberCount,
  resetCountdownClockForTests,
  setCountdownClockHidden,
  subscribeCountdownClock,
} from '../src/services/countdown-clock.js';

describe('Shared Countdown Clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetCountdownClockForTests();
  });

  afterEach(() => {
    resetCountdownClockForTests();
    vi.useRealTimers();
  });

  test('shared countdown clock uses one interval for multiple subscribers', () => {
    const first = vi.fn();
    const second = vi.fn();

    const unsubscribeFirst = subscribeCountdownClock(first);
    const unsubscribeSecond = subscribeCountdownClock(second);

    expect(getCountdownSubscriberCount()).toBe(2);

    vi.advanceTimersByTime(2000);
    expect(first.mock.calls.length).toBeGreaterThan(0);
    expect(second.mock.calls.length).toBe(first.mock.calls.length);

    unsubscribeFirst();
    unsubscribeSecond();
    expect(getCountdownSubscriberCount()).toBe(0);
  });

  test('hidden_document_pauses_or_reduces_countdown_ticks', () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeCountdownClock(subscriber);

    vi.advanceTimersByTime(1500);
    const visibleTicks = subscriber.mock.calls.length;
    expect(visibleTicks).toBeGreaterThan(0);

    setCountdownClockHidden(true);
    vi.advanceTimersByTime(3000);
    const ticksWhileHidden = subscriber.mock.calls.length;
    expect(ticksWhileHidden).toBe(visibleTicks);

    setCountdownClockHidden(false);
    vi.advanceTimersByTime(1500);
    expect(subscriber.mock.calls.length).toBeGreaterThan(ticksWhileHidden);

    unsubscribe();
  });

  test('document visibility automatically pauses and resumes without waiting for a stale interval', () => {
    const subscriber = vi.fn();
    const hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const unsubscribe = subscribeCountdownClock(subscriber);

    vi.advanceTimersByTime(1500);
    const visibleTicks = subscriber.mock.calls.length;

    hiddenSpy.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(3000);
    expect(subscriber).toHaveBeenCalledTimes(visibleTicks);

    hiddenSpy.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(subscriber).toHaveBeenCalledTimes(visibleTicks + 1);

    unsubscribe();
    hiddenSpy.mockRestore();
  });
});
