// @ts-nocheck -- focused seam tests for pause feature delegation
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/features/pause/index.js', () => ({
  runPauseFeature: vi.fn(),
}));

import '../src/index.ts';
import { runPauseFeature } from '../src/features/pause/index.js';

describe('Pause Feature Delegation', () => {
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

  test('delegates successful snooze execution to the pause feature', async () => {
    runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Snoozed',
      lastDuration: {
        minutes: 60,
        duration: { days: 0, hours: 1, minutes: 0 },
        timestamp: 123,
      },
    });

    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 1, minutes: 0 };

    await card._snooze();

    expect(runPauseFeature).toHaveBeenCalledWith({
      hass: mockHass,
      selected: ['automation.test'],
      scheduleMode: false,
      customDuration: { days: 0, hours: 1, minutes: 0 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '',
      resumeAtTime: '',
      forceConfirm: false,
    });
    expect(card._selected).toEqual([]);
    expect(card._lastDuration).toEqual({
      minutes: 60,
      duration: { days: 0, hours: 1, minutes: 0 },
      timestamp: 123,
    });
  });

  test('opens the guardrail confirmation UI when the pause feature requests confirmation', async () => {
    runPauseFeature.mockResolvedValue({ status: 'confirm_required' });

    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    expect(runPauseFeature).toHaveBeenCalledOnce();
    expect(card._guardrailConfirmOpen).toBe(true);
    expect(card._selected).toEqual(['automation.test']);
  });

  test('keeps retry state intact when the delegated pause feature fails', async () => {
    runPauseFeature.mockRejectedValue(new Error('Network error'));

    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    expect(runPauseFeature).toHaveBeenCalledOnce();
    expect(card._loading).toBe(false);
    expect(card._selected).toEqual(['automation.test']);
  });
});
