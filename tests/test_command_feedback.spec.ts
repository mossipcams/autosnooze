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
import * as resumeFeature from '../src/features/resume/index.js';
import * as scheduledFeature from '../src/features/scheduled-snooze/index.js';

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

  test.each([
    ['resume entity', 'runWake', ['automation.ok'], resumeFeature, 'runWakeFeature'],
    ['resume all', 'runWakeAll', [], resumeFeature, 'runWakeAllFeature'],
    ['cancel scheduled', 'runCancelScheduled', ['automation.ok'], scheduledFeature, 'runCancelScheduledFeature'],
  ])('duplicate %s submission invokes the backend once', async (_label, method, args, feature, featureMethod) => {
    let resolveCommand;
    const command = vi.spyOn(feature, featureMethod).mockImplementation(() => new Promise((resolve) => {
      resolveCommand = resolve;
    }));

    const first = controller[method](...args);
    const second = controller[method](...args);

    expect(command).toHaveBeenCalledTimes(1);
    resolveCommand({ succeeded: ['automation.ok'], failed: [] });
    await first;
    await second;
  });

  test('duplicate adjust submission invokes the backend once', async () => {
    let resolveCommand;
    const command = vi.spyOn(scheduledFeature, 'runAdjustFeature').mockImplementation(() => new Promise((resolve) => {
      resolveCommand = resolve;
    }));
    controller.openAdjustAutomation({
      entityId: 'automation.ok',
      friendlyName: 'OK',
      resumeAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const first = controller.runAdjustTime({ entityId: 'automation.ok', minutes: 15 });
    const second = controller.runAdjustTime({ entityId: 'automation.ok', minutes: 15 });

    expect(command).toHaveBeenCalledTimes(1);
    resolveCommand({ nextResumeAt: new Date(Date.now() + 120_000).toISOString() });
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
    expect(vm.local.selected).toEqual(['automation.failed']);
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
    expect(controller.getViewModel().persistentStatus).toContain('Recovery required');

    runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Paused',
      succeeded: ['automation.failed'],
      failed: [],
    });
    controller.setSelection(['automation.failed']);
    await controller.runSnooze();

    expect(controller.getViewModel().toast?.message).toBe('Paused');
    expect(controller.getViewModel().persistentStatus).toBeNull();
  });
});
