// @ts-nocheck -- controller contract tests use public feature APIs
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/features/pause/index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    runPauseFeature: vi.fn(),
    requiresPauseConfirmation: vi.fn().mockReturnValue(false),
  };
});

vi.mock('../src/features/card-shell/index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchCardLabelRegistry: vi.fn().mockResolvedValue({ confirm: { label_id: 'confirm', name: 'autosnooze_confirm' } }),
    fetchCardCategoryRegistry: vi.fn().mockResolvedValue({}),
    fetchCardEntityRegistry: vi.fn().mockResolvedValue({}),
    getCardPausedSnapshot: vi.fn().mockReturnValue({
      paused: {},
      scheduled: {},
      groups: [],
    }),
    loadCardLastDuration: vi.fn().mockReturnValue(null),
    loadCardRecentSnoozeIds: vi.fn().mockReturnValue([]),
  };
});

import '../src/index.ts';
import {
  CardController,
  createCardController,
  localizeScheduleValidationError,
} from '../src/features/card-controller/index.js';
import { runPauseFeature } from '../src/features/pause/index.js';
import {
  fetchCardLabelRegistry,
  getCardPausedSnapshot,
} from '../src/features/card-shell/index.js';
import { validateScheduledPauseInput } from '../src/features/scheduled-snooze/index.js';

describe('Card Controller', () => {
  let controller;
  let mockHass;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = createCardController();
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
      locale: { language: 'en' },
      language: 'en',
      connection: { sendMessagePromise: vi.fn() },
    });
    controller.connect(mockHass);
  });

  test('exposes one immutable view model from server and local state', () => {
    getCardPausedSnapshot.mockReturnValue({
      paused: { 'automation.test': { friendly_name: 'Test', resume_at: '2030-01-01T12:00:00Z' } },
      scheduled: {},
      groups: [{ resumeAt: '2030-01-01T12:00:00Z', automations: [] }],
    });
    controller.setHass(mockHass);
    controller.setSelection(['automation.test']);

    const first = controller.getViewModel();
    const second = controller.getViewModel();

    expect(first).not.toBe(second);
    expect(first.server.pausedCount).toBe(1);
    expect(first.local.selected).toEqual(['automation.test']);
    expect(first.derived.automations.length).toBeGreaterThan(0);
    expect(first.registry.labels).toBeDefined();
    expect(first.modal.open).toBe(false);
    expect(first.toast).toBeNull();
  });

  test('owns registry retry and command result interpretation', async () => {
    fetchCardLabelRegistry
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ confirm: { label_id: 'confirm', name: 'autosnooze_confirm' } });

    const retryController = new CardController();
    retryController.connect(mockHass);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    retryController.setHass(mockHass);

    const vm = retryController.getViewModel();
    expect(vm.registry.labelRegistryUnavailable).toBe(false);
    expect(fetchCardLabelRegistry.mock.calls.length).toBeGreaterThanOrEqual(2);

    runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Paused',
      succeeded: ['automation.test'],
      failed: [],
    });
    controller.setSelection(['automation.test']);
    await controller.runSnooze();

    const afterPause = controller.getViewModel();
    expect(afterPause.local.selected).toEqual([]);
    expect(afterPause.toast?.message).toBe('Paused');
    expect(runPauseFeature).toHaveBeenCalled();
  });

  test('unrelated hass state change reuses automation read model', () => {
    controller.setHass(mockHass);
    const first = controller.getAutomationReadModel();

    const nextStates = {
      ...mockHass.states,
      'sensor.unrelated': { state: 'changed', attributes: {} },
    };
    controller.setHass({ ...mockHass, states: nextStates });
    const second = controller.getAutomationReadModel();

    expect(second).toBe(first);
  });

  test('localizes typed schedule validation errors without message comparisons', () => {
    const validation = validateScheduledPauseInput({
      disableAtDate: '2030-06-15',
      disableAtTime: '13:00',
      resumeAtDate: '2030-06-15',
      resumeAtTime: '12:00',
      nowMs: Date.parse('2030-06-01T00:00:00Z'),
    });

    expect(validation.status).toBe('error');
    expect(validation.code).toBe('disable_before_resume');
    expect(localizeScheduleValidationError(mockHass, validation.code)).toBeTruthy();
  });
});

describe('Card renders controller view model', () => {
  test('card renders prepared values and delegates named actions', async () => {
    const CardClass = customElements.get('autosnooze-card');
    const card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
    document.body.appendChild(card);
    await card.updateComplete;

    expect(card.shadowRoot.querySelector('autosnooze-automation-list')).not.toBeNull();
    expect(card.shadowRoot.querySelector('autosnooze-duration-selector')).not.toBeNull();
    expect(card.shadowRoot.querySelector<HTMLButtonElement>('.snooze-btn')?.disabled).toBe(true);
  });
});
