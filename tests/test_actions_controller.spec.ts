// @ts-nocheck -- focused unit tests for action service seams and undo orchestration
/**
 * Tests for snooze service delegation and resume-feature undo orchestration.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/services/snooze.js', () => ({
  pauseAutomations: vi.fn(),
  wakeAutomation: vi.fn(),
  wakeAll: vi.fn(),
  cancelScheduled: vi.fn(),
  adjustSnooze: vi.fn(),
}));

import { runUndoFeature } from '../src/features/resume/index.js';
import {
  adjustSnooze,
  cancelScheduled,
  pauseAutomations,
  wakeAll,
  wakeAutomation,
} from '../src/services/snooze.js';

describe('Action service seams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('pauseAutomations forwards payload unchanged', async () => {
    const hass = createMockHass();
    const params = { entity_id: ['automation.a'], hours: 1 };

    await pauseAutomations(hass, params);
    expect(pauseAutomations).toHaveBeenCalledWith(hass, params);
  });

  test('wakeAutomation and wakeAll call expected services', async () => {
    const hass = createMockHass();
    await wakeAutomation(hass, 'automation.a');
    await wakeAll(hass);

    expect(wakeAutomation).toHaveBeenCalledWith(hass, 'automation.a');
    expect(wakeAll).toHaveBeenCalledWith(hass);
  });

  test('cancelScheduled and adjustSnooze call expected services', async () => {
    const hass = createMockHass();
    await cancelScheduled(hass, 'automation.s');
    await adjustSnooze(hass, ['automation.a'], { minutes: 15 });

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
