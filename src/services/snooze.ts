/**
 * Snooze service calls for AutoSnooze card.
 */

import type { HomeAssistant } from '../types/hass.js';
import type { PauseServiceParams } from '../types/automation.js';
import type { CommandServiceResponse } from '../types/service-response.js';
import { isCommandServiceResponse } from '../types/service-response.js';

type ServiceCallOptions = {
  returnResponse?: boolean;
};

async function callAutosnoozeService(
  hass: HomeAssistant,
  service: string,
  params: Record<string, unknown>,
  options: ServiceCallOptions = {},
): Promise<CommandServiceResponse | undefined> {
  const response = await hass.callService('autosnooze', service, params, options.returnResponse
    ? { return_response: true }
    : undefined);

  if (response === undefined || response === null) {
    return undefined;
  }

  if (!isCommandServiceResponse(response)) {
    throw new Error(`[AutoSnooze] Unexpected ${service} service response shape`);
  }

  return response;
}

/**
 * Pause (snooze) one or more automations.
 */
export async function pauseAutomations(
  hass: HomeAssistant,
  params: PauseServiceParams,
  options: ServiceCallOptions = {},
): Promise<CommandServiceResponse | undefined> {
  try {
    return await callAutosnoozeService(hass, 'pause', params, options);
  } catch (error) {
    console.error('[AutoSnooze] Failed to pause automations:', error);
    throw error;
  }
}

/**
 * Wake (cancel snooze) for one or more automations.
 */
export async function wakeAutomation(
  hass: HomeAssistant,
  entityId: string | string[],
  options: ServiceCallOptions = {},
): Promise<CommandServiceResponse | undefined> {
  try {
    return await callAutosnoozeService(
      hass,
      'cancel',
      { entity_id: entityId },
      options,
    );
  } catch (error) {
    console.error('[AutoSnooze] Failed to wake automation:', error);
    throw error;
  }
}

/**
 * Wake all snoozed automations.
 */
export async function wakeAll(
  hass: HomeAssistant,
  options: ServiceCallOptions = {},
): Promise<CommandServiceResponse | undefined> {
  try {
    return await callAutosnoozeService(hass, 'cancel_all', {}, options);
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
  entityId: string | string[],
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
 * Clear notification settings from an active snooze.
 */
export async function clearNotification(
  hass: HomeAssistant,
  entityId: string | string[],
): Promise<void> {
  try {
    await hass.callService('autosnooze', 'clear_notification', {
      entity_id: entityId,
    });
  } catch (error) {
    console.error('[AutoSnooze] Failed to clear snooze notification:', error);
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
  params: { days?: number; hours?: number; minutes?: number },
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
