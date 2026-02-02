/**
 * Shared countdown timer utility for synchronized second-boundary updates.
 */

import { UI_TIMING } from '../constants/index.js';

export interface CountdownState {
  interval: number | null;
  syncTimeout: number | null;
}

/**
 * Start a countdown timer synchronized to second boundaries.
 * Returns a CountdownState that can be passed to stopCountdown() for cleanup.
 */
export function startSynchronizedCountdown(onTick: () => void): CountdownState {
  const state: CountdownState = { interval: null, syncTimeout: null };
  const now = Date.now();
  const msUntilNextSecond = 1000 - (now % 1000);
  state.syncTimeout = window.setTimeout(() => {
    state.syncTimeout = null;
    onTick();
    state.interval = window.setInterval(() => {
      onTick();
    }, UI_TIMING.COUNTDOWN_INTERVAL_MS);
  }, msUntilNextSecond);
  return state;
}

/**
 * Stop a countdown timer, clearing both the interval and sync timeout.
 */
export function stopCountdown(state: CountdownState): void {
  if (state.interval !== null) {
    clearInterval(state.interval);
    state.interval = null;
  }
  if (state.syncTimeout !== null) {
    clearTimeout(state.syncTimeout);
    state.syncTimeout = null;
  }
}
