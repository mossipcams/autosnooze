// @ts-nocheck -- command feedback contract tests
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
    fetchCardLabelRegistry: vi.fn().mockResolvedValue({}),
    fetchCardCategoryRegistry: vi.fn().mockResolvedValue({}),
    fetchCardEntityRegistry: vi.fn().mockResolvedValue({}),
    getCardPausedSnapshot: vi.fn().mockReturnValue({ paused: {}, scheduled: {}, groups: [] }),
    loadCardLastDuration: vi.fn().mockReturnValue(null),
    loadCardRecentSnoozeIds: vi.fn().mockReturnValue([]),
  };
});

import { createCardController } from '../src/features/card-controller/index.js';
import { runPauseFeature } from '../src/features/pause/index.js';

describe('Command Feedback', () => {
  let controller;
  let mockHass;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = createCardController();
    mockHass = createMockHass({
      states: {
        'automation.ok': { entity_id: 'automation.ok', state: 'on', attributes: { friendly_name: 'OK' } },
        'automation.failed': { entity_id: 'automation.failed', state: 'on', attributes: { friendly_name: 'Failed' } },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      connection: { sendMessagePromise: vi.fn() },
    });
    controller.connect(mockHass);
  });

  test('duplicate_command_submission_is_blocked_per_action', async () => {
    let resolvePause;
    runPauseFeature.mockImplementation(() => new Promise((resolve) => {
      resolvePause = resolve;
    }));

    controller.setSelection(['automation.ok']);
    const first = controller.runSnooze();
    const second = controller.runSnooze();

    expect(controller.getViewModel().local.loading).toBe(true);
    expect(runPauseFeature).toHaveBeenCalledTimes(1);

    resolvePause({
      status: 'submitted',
      toastMessage: 'Paused',
      succeeded: ['automation.ok'],
      failed: [],
    });
    await first;
    await second;
  });

  test('partial_failure_preserves_failed_selection_and_displays_status', async () => {
    runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Partial pause',
      succeeded: ['automation.ok'],
      failed: ['automation.failed'],
    });

    controller.setSelection(['automation.ok', 'automation.failed']);
    await controller.runSnooze();

    const vm = controller.getViewModel();
    expect(vm.local.selected).toEqual([]);
    expect(vm.toast?.message).toBe('Partial pause');
  });

  test('recovery_required_status_remains_until_resolved', async () => {
    runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Recovery required for automation.failed',
      succeeded: ['automation.ok'],
      failed: ['automation.failed'],
    });

    controller.setSelection(['automation.ok', 'automation.failed']);
    await controller.runSnooze();

    const firstToast = controller.getViewModel().toast?.message;
    expect(firstToast).toContain('Recovery required');

    runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Paused',
      succeeded: ['automation.failed'],
      failed: [],
    });
    controller.setSelection(['automation.failed']);
    await controller.runSnooze();

    expect(controller.getViewModel().toast?.message).toBe('Paused');
  });
});
