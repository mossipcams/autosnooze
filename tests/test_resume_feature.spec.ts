// @ts-nocheck -- focused seam tests for resume feature delegation
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/features/resume/index.js', () => ({
  runWakeFeature: vi.fn(),
  runWakeAllFeature: vi.fn(),
  runUndoFeature: vi.fn(),
}));

import '../src/index.ts';
import {
  runUndoFeature,
  runWakeAllFeature,
  runWakeFeature,
} from '../src/features/resume/index.js';

describe('Resume Feature Delegation', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  test('delegates single wake execution to the resume feature', async () => {
    runWakeFeature.mockResolvedValue(undefined);

    await card._wake('automation.test');

    expect(runWakeFeature).toHaveBeenCalledWith(mockHass, 'automation.test');
  });

  test('delegates wake-all execution to the resume feature', async () => {
    runWakeAllFeature.mockResolvedValue(undefined);

    await card._handleWakeAllEvent();

    expect(runWakeAllFeature).toHaveBeenCalledWith(mockHass);
  });

  test('delegates undo to the resume feature and re-selects only failed entities', async () => {
    runUndoFeature.mockResolvedValue({
      succeeded: [],
      failed: ['automation.test'],
    });

    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    expect(undoBtn).not.toBeNull();

    undoBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(runUndoFeature).toHaveBeenCalledWith(mockHass, ['automation.test'], {
      wasScheduleMode: false,
      hadDisableAt: false,
    });
    expect(card._selected).toEqual(['automation.test']);
  });
});
