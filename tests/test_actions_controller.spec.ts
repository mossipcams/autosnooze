// @ts-nocheck -- focused unit tests for feature service delegation
/**
 * Tests for pause/resume/scheduled feature service payload mapping.
 * Card orchestration uses these feature modules directly (no actions-controller layer).
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/services/snooze.js', () => ({
  pauseAutomations: vi.fn(),
  wakeAutomation: vi.fn(),
  wakeAll: vi.fn(),
  cancelScheduled: vi.fn(),
  adjustSnooze: vi.fn(),
}));

import { runPauseFeature } from '../src/features/pause/index.js';
import {
  runAdjustFeature,
  runCancelScheduledFeature,
} from '../src/features/scheduled-snooze/index.js';
import { runUndoFeature, runWakeAllFeature, runWakeFeature } from '../src/features/resume/index.js';
import {
  adjustSnooze,
  cancelScheduled,
  pauseAutomations,
  wakeAll,
  wakeAutomation,
} from '../src/services/snooze.js';

describe('Feature service delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('runPauseFeature forwards the built payload', async () => {
    const hass = createMockHass();
    const params = { entity_id: ['automation.a'], hours: 1 };

    await runPauseFeature({
      hass,
      selected: params.entity_id,
      scheduleMode: false,
      customDuration: { days: 0, hours: params.hours, minutes: 0 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '',
      resumeAtTime: '',
    });
    expect(pauseAutomations).toHaveBeenCalledWith(hass, { ...params, days: 0, minutes: 0 });
  });

  test('runWakeFeature and runWakeAllFeature call expected services', async () => {
    const hass = createMockHass();
    await runWakeFeature(hass, 'automation.a');
    await runWakeAllFeature(hass);

    expect(wakeAutomation).toHaveBeenCalledWith(hass, 'automation.a');
    expect(wakeAll).toHaveBeenCalledWith(hass);
  });

  test('runCancelScheduledFeature and runAdjustFeature call expected services', async () => {
    const hass = createMockHass();
    await runCancelScheduledFeature(hass, 'automation.s');
    await runAdjustFeature(hass, { entityIds: ['automation.a'], minutes: 15 }, '2026-01-01T00:00:00Z');

    expect(cancelScheduled).toHaveBeenCalledWith(hass, 'automation.s');
    expect(adjustSnooze).toHaveBeenCalledWith(hass, ['automation.a'], { minutes: 15 });
  });

  test('runUndoFeature uses wake path when not schedule mode', async () => {
    const hass = createMockHass();
    wakeAutomation.mockResolvedValue(undefined);

    const result = await runUndoFeature(hass, ['automation.a', 'automation.b'], {
      wasScheduleMode: false,
      hadDisableAt: false,
    });

    expect(wakeAutomation).toHaveBeenCalledTimes(2);
    expect(cancelScheduled).not.toHaveBeenCalled();
    expect(result).toEqual({ succeeded: ['automation.a', 'automation.b'], failed: [] });
  });

  test('runUndoFeature uses cancelScheduled path and reports partial failures', async () => {
    const hass = createMockHass();
    cancelScheduled
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('cancel failed'));

    const result = await runUndoFeature(hass, ['automation.a', 'automation.b'], {
      wasScheduleMode: true,
      hadDisableAt: true,
    });

    expect(cancelScheduled).toHaveBeenCalledTimes(2);
    expect(wakeAutomation).not.toHaveBeenCalled();
    expect(result).toEqual({ succeeded: ['automation.a'], failed: ['automation.b'] });
  });
});
