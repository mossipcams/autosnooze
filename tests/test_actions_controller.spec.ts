// @ts-nocheck -- focused unit tests for controller orchestration
/**
 * Tests for actions controller service payload mapping and error handling.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/services/index.js', () => ({
  pauseAutomations: vi.fn(),
  wakeAutomation: vi.fn(),
  wakeAll: vi.fn(),
  cancelScheduled: vi.fn(),
  adjustSnooze: vi.fn(),
}));

import {
  runAdjustAction,
  runCancelScheduledAction,
  runPauseAction,
  runUndoAction,
  runWakeAction,
  runWakeAllAction,
} from '../src/components/autosnooze-actions-controller.js';
import {
  adjustSnooze,
  cancelScheduled,
  pauseAutomations,
  wakeAll,
  wakeAutomation,
} from '../src/services/index.js';

describe('Actions Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('runPauseAction forwards payload unchanged', async () => {
    const hass = createMockHass();
    const params = { entity_id: ['automation.a'], hours: 1 };

    await runPauseAction(hass, params);
    expect(pauseAutomations).toHaveBeenCalledWith(hass, params);
  });

  test('runWakeAction and runWakeAllAction call expected services', async () => {
    const hass = createMockHass();
    await runWakeAction(hass, 'automation.a');
    await runWakeAllAction(hass);

    expect(wakeAutomation).toHaveBeenCalledWith(hass, 'automation.a');
    expect(wakeAll).toHaveBeenCalledWith(hass);
  });

  test('runCancelScheduledAction and runAdjustAction call expected services', async () => {
    const hass = createMockHass();
    await runCancelScheduledAction(hass, 'automation.s');
    await runAdjustAction(hass, ['automation.a'], { minutes: 15 });

    expect(cancelScheduled).toHaveBeenCalledWith(hass, 'automation.s');
    expect(adjustSnooze).toHaveBeenCalledWith(hass, ['automation.a'], { minutes: 15 });
  });

  test('runUndoAction uses wake path when not schedule mode', async () => {
    const hass = createMockHass();
    wakeAutomation.mockResolvedValue(undefined);

    const result = await runUndoAction(hass, ['automation.a', 'automation.b'], {
      wasScheduleMode: false,
      hadDisableAt: false,
    });

    expect(wakeAutomation).toHaveBeenCalledTimes(2);
    expect(cancelScheduled).not.toHaveBeenCalled();
    expect(result).toEqual({ succeeded: ['automation.a', 'automation.b'], failed: [] });
  });

  test('runUndoAction uses cancelScheduled path and reports partial failures', async () => {
    const hass = createMockHass();
    cancelScheduled
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('cancel failed'));

    const result = await runUndoAction(hass, ['automation.a', 'automation.b'], {
      wasScheduleMode: true,
      hadDisableAt: true,
    });

    expect(cancelScheduled).toHaveBeenCalledTimes(2);
    expect(wakeAutomation).not.toHaveBeenCalled();
    expect(result).toEqual({ succeeded: ['automation.a'], failed: ['automation.b'] });
  });
});
