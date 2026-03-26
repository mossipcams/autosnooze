/**
 * Action controller for AutoSnooze card service calls.
 * Keeps UI component lean by centralizing service-facing actions.
 */

import type { HomeAssistant } from '../types/hass.js';
import type { PauseServiceParams } from '../types/automation.js';
import {
  adjustSnooze,
  cancelScheduled,
  pauseAutomations,
  wakeAll,
  wakeAutomation,
} from '../services/index.js';

interface UndoActionResult {
  succeeded: string[];
  failed: string[];
}

export async function runPauseAction(hass: HomeAssistant, params: PauseServiceParams): Promise<void> {
  await pauseAutomations(hass, params);
}

export async function runWakeAction(hass: HomeAssistant, entityId: string): Promise<void> {
  await wakeAutomation(hass, entityId);
}

export async function runWakeAllAction(hass: HomeAssistant): Promise<void> {
  await wakeAll(hass);
}

export async function runCancelScheduledAction(hass: HomeAssistant, entityId: string): Promise<void> {
  await cancelScheduled(hass, entityId);
}

export async function runAdjustAction(
  hass: HomeAssistant,
  entityId: string | string[],
  params: { days?: number; hours?: number; minutes?: number }
): Promise<void> {
  await adjustSnooze(hass, entityId, params);
}

export async function runUndoAction(
  hass: HomeAssistant,
  entityIds: string[],
  options: { wasScheduleMode: boolean; hadDisableAt: boolean }
): Promise<UndoActionResult> {
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
