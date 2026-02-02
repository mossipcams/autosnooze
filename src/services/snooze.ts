/**
 * Snooze service calls for AutoSnooze card.
 */

import type { HomeAssistant } from '../types/hass.js';
import type { PauseServiceParams, PauseByAreaParams, PauseByLabelParams } from '../types/automation.js';

/**
 * Pause (snooze) one or more automations.
 */
export async function pauseAutomations(
  hass: HomeAssistant,
  params: PauseServiceParams
): Promise<void> {
  try {
    await hass.callService('autosnooze', 'pause', params);
  } catch (error) {
    console.error('[AutoSnooze] Failed to pause automations:', error);
    throw error;
  }
}

/**
 * Pause automations by area.
 */
export async function pauseByArea(
  hass: HomeAssistant,
  params: PauseByAreaParams
): Promise<void> {
  try {
    await hass.callService('autosnooze', 'pause_by_area', params);
  } catch (error) {
    console.error('[AutoSnooze] Failed to pause automations by area:', error);
    throw error;
  }
}

/**
 * Pause automations by label.
 */
export async function pauseByLabel(
  hass: HomeAssistant,
  params: PauseByLabelParams
): Promise<void> {
  try {
    await hass.callService('autosnooze', 'pause_by_label', params);
  } catch (error) {
    console.error('[AutoSnooze] Failed to pause automations by label:', error);
    throw error;
  }
}

/**
 * Wake (cancel snooze) for one or more automations.
 */
export async function wakeAutomation(
  hass: HomeAssistant,
  entityId: string | string[]
): Promise<void> {
  try {
    await hass.callService('autosnooze', 'cancel', {
      entity_id: entityId,
    });
  } catch (error) {
    console.error('[AutoSnooze] Failed to wake automation:', error);
    throw error;
  }
}

/**
 * Wake all snoozed automations.
 */
export async function wakeAll(hass: HomeAssistant): Promise<void> {
  try {
    await hass.callService('autosnooze', 'cancel_all', {});
  } catch (error) {
    console.error('[AutoSnooze] Failed to wake all automations:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled snooze.
 */
export async function cancelScheduled(
  hass: HomeAssistant,
  entityId: string | string[]
): Promise<void> {
  try {
    await hass.callService('autosnooze', 'cancel_scheduled', {
      entity_id: entityId,
    });
  } catch (error) {
    console.error('[AutoSnooze] Failed to cancel scheduled snooze:', error);
    throw error;
  }
}

/**
 * Adjust the snooze duration for a paused automation.
 * Positive values add time, negative values reduce time.
 */
export async function adjustSnooze(
  hass: HomeAssistant,
  entityId: string | string[],
  params: { days?: number; hours?: number; minutes?: number }
): Promise<void> {
  try {
    await hass.callService('autosnooze', 'adjust', {
      entity_id: entityId,
      ...params,
    });
  } catch (error) {
    console.error('[AutoSnooze] Failed to adjust snooze:', error);
    throw error;
  }
}
