import { test, expect } from '../fixtures/hass.fixture';

test.describe('AutoSnooze release-gate smoke @smoke', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // The fixture resets snoozes and automation states before and after the test.
  });

  test('critical card workflow: load, snooze, persist, and resume @smoke', async ({
    autosnoozeCard,
    getState,
    page,
  }) => {
    await expect(autosnoozeCard.snoozeButton).toBeDisabled();

    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('15m');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
    expect(await getState('automation.living_room_motion_lights')).toBe('off');

    await page.reload();
    await autosnoozeCard.waitForCardReady();
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    await autosnoozeCard.wakeAutomation('Living Room Motion Lights');
    await autosnoozeCard.waitForPausedAutomationGone('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(0);
    expect(await getState('automation.living_room_motion_lights')).toBe('on');
  });

  test('invalid duration is rejected before a service call @smoke', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('invalid');

    expect(await autosnoozeCard.isDurationInputValid()).toBe(false);
    await autosnoozeCard.expectSnoozeButtonDisabled();
    await autosnoozeCard.expectPausedCount(0);
  });
});
