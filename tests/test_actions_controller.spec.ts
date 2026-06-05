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

import { runPauseActionFeature } from '../src/features/pause/index.js';
import {
  runAdjustActionFeature,
  runCancelScheduledActionFeature,
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

  test('runPauseActionFeature forwards payload unchanged', async () => {
    const hass = createMockHass();
    const params = { entity_id: ['automation.a'], hours: 1 };

    await runPauseActionFeature(hass, params);
    expect(pauseAutomations).toHaveBeenCalledWith(hass, params);
  });

  test('runWakeFeature and runWakeAllFeature call expected services', async () => {
    const hass = createMockHass();
    await runWakeFeature(hass, 'automation.a');
    await runWakeAllFeature(hass);

    expect(wakeAutomation).toHaveBeenCalledWith(hass, 'automation.a', { returnResponse: true });
    expect(wakeAll).toHaveBeenCalledWith(hass, { returnResponse: true });
  });

  test('runCancelScheduledActionFeature and runAdjustActionFeature call expected services', async () => {
    const hass = createMockHass();
    await runCancelScheduledActionFeature(hass, 'automation.s');
    await runAdjustActionFeature(hass, ['automation.a'], { minutes: 15 });

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

    expect(wakeAutomation).toHaveBeenCalledOnce();
    expect(wakeAutomation).toHaveBeenCalledWith(
      hass,
      ['automation.a', 'automation.b'],
      { returnResponse: true },
    );
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
