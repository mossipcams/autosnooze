/**
 * Resume feature orchestration for waking and undoing snoozes.
 */

import { cancelScheduled, clearNotification, wakeAll, wakeAutomation } from '../../services/snooze.js';
import type { HomeAssistant } from '../../types/hass.js';
import type { CommandServiceResponse } from '../../types/service-response.js';

interface UndoFeatureResult {
  succeeded: string[];
  failed: string[];
}

export interface WakeFeatureResult {
  commandResponse?: CommandServiceResponse;
  succeeded: string[];
  failed: string[];
}

function splitCommandEntities(
  commandResponse: CommandServiceResponse | undefined,
  requested: string[],
): Pick<WakeFeatureResult, 'succeeded' | 'failed'> {
  if (!commandResponse) {
    return { succeeded: requested, failed: [] };
  }

  return {
    succeeded: commandResponse.entities
      .filter((entity) => entity.outcome === 'succeeded')
      .map((entity) => entity.entity_id),
    failed: commandResponse.entities
      .filter((entity) => entity.outcome !== 'succeeded')
      .map((entity) => entity.entity_id),
  };
}

export async function runWakeFeature(hass: HomeAssistant, entityId: string): Promise<WakeFeatureResult> {
  const commandResponse = await wakeAutomation(hass, entityId, { returnResponse: true });
  const { succeeded, failed } = splitCommandEntities(commandResponse, [entityId]);
  if (commandResponse && !commandResponse.complete_success && succeeded.length === 0) {
    throw new Error('wake_command_failed');
  }
  return { commandResponse, succeeded, failed };
}

export async function runWakeAllFeature(hass: HomeAssistant): Promise<WakeFeatureResult> {
  const commandResponse = await wakeAll(hass, { returnResponse: true });
  const entities = commandResponse?.entities.map((entity) => entity.entity_id) ?? [];
  const { succeeded, failed } = splitCommandEntities(commandResponse, entities);
  if (commandResponse && !commandResponse.complete_success && succeeded.length === 0) {
    throw new Error('wake_all_command_failed');
  }
  return { commandResponse, succeeded, failed };
}

export async function runClearNotificationFeature(
  hass: HomeAssistant,
  entityId: string,
): Promise<void> {
  await clearNotification(hass, entityId);
}

export async function runUndoFeature(
  hass: HomeAssistant,
  entityIds: string[],
  options: { wasScheduleMode: boolean; hadDisableAt: boolean }
): Promise<UndoFeatureResult> {
  if (options.wasScheduleMode && options.hadDisableAt) {
    const settled = await Promise.allSettled(entityIds.map((entityId) => cancelScheduled(hass, entityId)));
    const succeeded: string[] = [];
    const failed: string[] = [];
    settled.forEach((result, index) => {
      const entityId = entityIds[index];
      if (!entityId) {
        return;
      }
      if (result.status === 'fulfilled') {
        succeeded.push(entityId);
      } else {
        failed.push(entityId);
      }
    });
    return { succeeded, failed };
  }

  const undoCall = wakeAutomation(hass, entityIds, { returnResponse: true });
  const commandResponse = await undoCall;
  const { succeeded, failed } = splitCommandEntities(commandResponse, entityIds);
  return { succeeded, failed };
}
