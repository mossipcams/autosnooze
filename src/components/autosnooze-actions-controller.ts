/**
 * Action controller for AutoSnooze card service calls.
 * Keeps UI component lean by centralizing service-facing actions.
 */

import type { HomeAssistant } from '../types/hass.js';
import type { PauseServiceParams } from '../types/automation.js';
import {
  runUndoFeature,
  runWakeAllFeature,
  runWakeFeature,
} from '../features/resume/index.js';
import {
  adjustSnooze,
  cancelScheduled,
  pauseAutomations,
} from '../services/snooze.js';

export async function runPauseAction(hass: HomeAssistant, params: PauseServiceParams): Promise<void> {
  await pauseAutomations(hass, params);
}

export async function runWakeAction(hass: HomeAssistant, entityId: string): Promise<void> {
  await runWakeFeature(hass, entityId);
}

export async function runWakeAllAction(hass: HomeAssistant): Promise<void> {
  await runWakeAllFeature(hass);
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
): Promise<{ succeeded: string[]; failed: string[] }> {
  return runUndoFeature(hass, entityIds, options);
}
