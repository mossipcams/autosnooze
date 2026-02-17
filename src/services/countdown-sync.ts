/**
 * Countdown sync service with second-boundary alignment and drift correction.
 */

import { UI_TIMING } from '../constants/index.js';
import type { CountdownState } from '../utils/countdown-timer.js';

const DRIFT_RESYNC_THRESHOLD_MS = 50;

function scheduleResync(state: CountdownState, onTick: () => void): void {
  const msUntilNextSecond = 1000 - (Date.now() % 1000);
  state.syncTimeout = window.setTimeout(() => {
    state.syncTimeout = null;
    onTick();
    state.interval = window.setInterval(() => {
      onTick();
      const driftMs = Date.now() % 1000;
      if (driftMs > DRIFT_RESYNC_THRESHOLD_MS) {
        // Clock drift detected; re-align to the next second boundary.
        stopCountdownSync(state);
        scheduleResync(state, onTick);
      }
    }, UI_TIMING.COUNTDOWN_INTERVAL_MS);
  }, msUntilNextSecond);
}

export function startCountdownSync(onTick: () => void): CountdownState {
  const state: CountdownState = { interval: null, syncTimeout: null };
  scheduleResync(state, onTick);
  return state;
}

export function stopCountdownSync(state: CountdownState): void {
  if (state.interval !== null) {
    clearInterval(state.interval);
    state.interval = null;
  }
  if (state.syncTimeout !== null) {
    clearTimeout(state.syncTimeout);
    state.syncTimeout = null;
  }
}
