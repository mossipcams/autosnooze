/**
 * Haptic feedback utilities for AutoSnooze card.
 * Uses Home Assistant's native haptic event for cross-platform support.
 */

import type { HapticFeedbackType } from '../types/card.js';

/**
 * Trigger haptic feedback using Home Assistant's native haptic system.
 * This works on both iOS and Android through the HA Companion App.
 *
 * Fires a 'hass-haptic' event that HA's frontend forwards to the native app.
 */
export function hapticFeedback(type: HapticFeedbackType = 'light'): void {
  fireEvent(window, 'haptic', type);
}

/**
 * Fire a custom event on a target element.
 * Used internally to dispatch haptic events to Home Assistant.
 */
function fireEvent(
  target: EventTarget,
  type: string,
  detail?: HapticFeedbackType
): void {
  const event = new CustomEvent(`hass-${type}`, {
    bubbles: true,
    composed: true,
    detail,
  });
  target.dispatchEvent(event);
}
