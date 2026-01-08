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
  await hass.callService('autosnooze', 'pause', params);
}

/**
 * Pause automations by area.
 */
export async function pauseByArea(
  hass: HomeAssistant,
  params: PauseByAreaParams
): Promise<void> {
  await hass.callService('autosnooze', 'pause_by_area', params);
}

/**
 * Pause automations by label.
 */
export async function pauseByLabel(
  hass: HomeAssistant,
  params: PauseByLabelParams
): Promise<void> {
  await hass.callService('autosnooze', 'pause_by_label', params);
}

/**
 * Wake (cancel snooze) for one or more automations.
 */
export async function wakeAutomation(
  hass: HomeAssistant,
  entityId: string | string[]
): Promise<void> {
  await hass.callService('autosnooze', 'cancel', {
    entity_id: entityId,
  });
}

/**
 * Wake all snoozed automations.
 */
export async function wakeAll(hass: HomeAssistant): Promise<void> {
  await hass.callService('autosnooze', 'cancel_all', {});
}

/**
 * Cancel a scheduled snooze.
 */
export async function cancelScheduled(
  hass: HomeAssistant,
  entityId: string | string[]
): Promise<void> {
  await hass.callService('autosnooze', 'cancel_scheduled', {
    entity_id: entityId,
  });
}
