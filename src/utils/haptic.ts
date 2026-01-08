/**
 * Haptic feedback utilities for AutoSnooze card.
 */

import { HAPTIC_PATTERNS } from '../constants/index.js';
import type { HapticFeedbackType } from '../types/card.js';

/**
 * Trigger haptic feedback for touch interactions.
 * Uses the Vibration API when available for tactile response.
 */
export function hapticFeedback(type: HapticFeedbackType = 'light'): void {
  if (!navigator.vibrate) return;

  const pattern = HAPTIC_PATTERNS[type];
  if (pattern !== undefined) {
    navigator.vibrate(pattern);
  }
}
