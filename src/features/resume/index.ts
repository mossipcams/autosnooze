/**
 * Resume feature orchestration for waking and undoing snoozes.
 */

import { cancelScheduled, wakeAutomation } from '../../services/snooze.js';
import type { HomeAssistant } from '../../types/hass.js';

interface UndoFeatureResult {
  succeeded: string[];
  failed: string[];
}

export { wakeAutomation as runWakeFeature, wakeAll as runWakeAllFeature } from '../../services/snooze.js';

export async function runUndoFeature(
  hass: HomeAssistant,
  entityIds: string[],
  options: { wasScheduleMode: boolean; hadDisableAt: boolean }
): Promise<UndoFeatureResult> {
  const undoCall = options.wasScheduleMode && options.hadDisableAt
    ? (entityId: string) => cancelScheduled(hass, entityId)
    : (entityId: string) => wakeAutomation(hass, entityId);

  const settled = await Promise.allSettled(entityIds.map((entityId) => undoCall(entityId)));

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
