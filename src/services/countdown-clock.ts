/**
 * Shared countdown clock for all card countdown subscribers.
 */

import { UI_TIMING } from '../constants/index.js';

type CountdownSubscriber = () => void;

interface SharedCountdownClockState {
  subscribers: Set<CountdownSubscriber>;
  interval: ReturnType<typeof globalThis.setInterval> | null;
  syncTimeout: ReturnType<typeof globalThis.setTimeout> | null;
  hidden: boolean;
}

const clock: SharedCountdownClockState = {
  subscribers: new Set(),
  interval: null,
  syncTimeout: null,
  hidden: false,
};

function stopClock(): void {
  if (clock.interval !== null) {
    globalThis.clearInterval(clock.interval);
    clock.interval = null;
  }
  if (clock.syncTimeout !== null) {
    globalThis.clearTimeout(clock.syncTimeout);
    clock.syncTimeout = null;
  }
}

function notifySubscribers(): void {
  for (const subscriber of clock.subscribers) {
    subscriber();
  }
}

function startClock(): void {
  if (clock.hidden || clock.subscribers.size === 0 || clock.interval !== null) {
    return;
  }

  const msUntilNextSecond = 1000 - (Date.now() % 1000);
  clock.syncTimeout = globalThis.setTimeout(() => {
    clock.syncTimeout = null;
    notifySubscribers();
    clock.interval = globalThis.setInterval(() => {
      notifySubscribers();
    }, UI_TIMING.COUNTDOWN_INTERVAL_MS);
  }, msUntilNextSecond);
}

function syncClockLifecycle(): void {
  stopClock();
  if (clock.subscribers.size === 0 || clock.hidden) {
    return;
  }
  startClock();
}

export function subscribeCountdownClock(subscriber: CountdownSubscriber): () => void {
  clock.subscribers.add(subscriber);
  syncClockLifecycle();
  return () => {
    clock.subscribers.delete(subscriber);
    syncClockLifecycle();
  };
}

export function setCountdownClockHidden(hidden: boolean): void {
  clock.hidden = hidden;
  syncClockLifecycle();
}

export function getCountdownSubscriberCount(): number {
  return clock.subscribers.size;
}

export function resetCountdownClockForTests(): void {
  clock.subscribers.clear();
  clock.hidden = false;
  stopClock();
}
