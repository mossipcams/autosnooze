import { test, expect } from '../fixtures/hass.fixture';

test.describe('PR #329 Service Reactivity', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture reset runs automatically.
  });

  test('service-driven pause and cancel update the correct paused card without a manual refresh', async ({
    autosnoozeCard,
    callService,
  }) => {
    await autosnoozeCard.expectPausedCount(0);
    await expect(autosnoozeCard.getPausedAutomationTexts()).resolves.not.toContain(
      expect.stringContaining('Living Room Motion Lights')
    );

    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      hours: 1,
    });

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights', 15000);
    await autosnoozeCard.expectPausedCount(1);
    await expect(autosnoozeCard.getPausedAutomationTexts()).resolves.toContainEqual(
      expect.stringContaining('Living Room Motion Lights')
    );

    await callService('autosnooze', 'cancel', {
      entity_id: 'automation.living_room_motion_lights',
    });

    await autosnoozeCard.waitForPausedAutomationGone('Living Room Motion Lights', 15000);
    await autosnoozeCard.expectPausedCount(0);
    await expect(autosnoozeCard.getPausedAutomationTexts()).resolves.not.toContain(
      expect.stringContaining('Living Room Motion Lights')
    );
    expect(await autosnoozeCard.getScheduledCount()).toBe(0);
  });

  test('service-driven schedule and cancel_scheduled update the correct scheduled card without refresh', async ({
    autosnoozeCard,
    callService,
  }) => {
    const disableAt = new Date();
    disableAt.setDate(disableAt.getDate() + 1);
    disableAt.setHours(8, 0, 0, 0);

    const resumeAt = new Date(disableAt);
    resumeAt.setHours(11, 0, 0, 0);

    await autosnoozeCard.expectScheduledCount(0);
    await expect(autosnoozeCard.getScheduledAutomationTexts()).resolves.not.toContain(
      expect.stringContaining('Kitchen Motion Lights')
    );

    await callService('autosnooze', 'pause', {
      entity_id: 'automation.kitchen_motion_lights',
      disable_at: disableAt.toISOString(),
      resume_at: resumeAt.toISOString(),
    });

    await autosnoozeCard.waitForScheduledAutomation('Kitchen Motion Lights', 15000);
    await autosnoozeCard.expectScheduledCount(1);
    expect(await autosnoozeCard.getPausedCount()).toBe(0);
    await expect(autosnoozeCard.getScheduledAutomationTexts()).resolves.toContainEqual(
      expect.stringContaining('Kitchen Motion Lights')
    );

    await callService('autosnooze', 'cancel_scheduled', {
      entity_id: 'automation.kitchen_motion_lights',
    });

    await autosnoozeCard.waitForScheduledAutomationGone('Kitchen Motion Lights', 15000);
    await autosnoozeCard.expectScheduledCount(0);
    await expect(autosnoozeCard.getScheduledAutomationTexts()).resolves.not.toContain(
      expect.stringContaining('Kitchen Motion Lights')
    );
  });
});
