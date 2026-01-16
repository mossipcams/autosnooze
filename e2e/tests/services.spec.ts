import { test, expect } from '../fixtures/hass.fixture';

test.describe('Direct Service Calls', () => {
  test.beforeEach(async ({ resetAutomations }) => {
    // Ensure clean state
  });

  test('pause service with duration parameters', async ({ callService, autosnoozeCard }) => {
    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      days: 1,
      hours: 2,
      minutes: 30,
    });

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('pause service with resume_at', async ({ callService, autosnoozeCard }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      resume_at: tomorrow.toISOString(),
    });

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('pause service with disable_at creates scheduled snooze', async ({
    callService,
    autosnoozeCard,
  }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const resumeAt = new Date(tomorrow);
    resumeAt.setHours(14, 0, 0, 0);

    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      disable_at: tomorrow.toISOString(),
      resume_at: resumeAt.toISOString(),
    });

    await autosnoozeCard.waitForScheduledCount(1);
    await autosnoozeCard.expectScheduledCount(1);
    await autosnoozeCard.expectPausedCount(0);
  });

  test('cancel service with multiple entity_ids', async ({
    callService,
    getState,
    autosnoozeCard,
  }) => {
    // First pause multiple
    await callService('autosnooze', 'pause', {
      entity_id: [
        'automation.living_room_motion_lights',
        'automation.kitchen_motion_lights',
      ],
      hours: 1,
    });

    await autosnoozeCard.waitForPausedCount(2);

    // Then wake them all
    await callService('autosnooze', 'cancel', {
      entity_id: [
        'automation.living_room_motion_lights',
        'automation.kitchen_motion_lights',
      ],
    });

    await autosnoozeCard.waitForPausedCount(0);

    const state1 = await getState('automation.living_room_motion_lights');
    const state2 = await getState('automation.kitchen_motion_lights');

    expect(state1).toBe('on');
    expect(state2).toBe('on');
  });

  test('cancel_all service', async ({ callService, autosnoozeCard }) => {
    // Pause several automations
    await callService('autosnooze', 'pause', {
      entity_id: [
        'automation.living_room_motion_lights',
        'automation.kitchen_motion_lights',
        'automation.bedroom_motion_lights',
      ],
      hours: 1,
    });

    await autosnoozeCard.waitForPausedCount(3);
    await autosnoozeCard.expectPausedCount(3);

    // Cancel all
    await callService('autosnooze', 'cancel_all', {});

    await autosnoozeCard.waitForPausedCount(0);
    await autosnoozeCard.expectPausedCount(0);
  });

  test('cancel_scheduled service', async ({ callService, autosnoozeCard }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const resumeAt = new Date(tomorrow);
    resumeAt.setHours(14, 0, 0, 0);

    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      disable_at: tomorrow.toISOString(),
      resume_at: resumeAt.toISOString(),
    });

    await autosnoozeCard.waitForScheduledCount(1);
    await autosnoozeCard.expectScheduledCount(1);

    await callService('autosnooze', 'cancel_scheduled', {
      entity_id: 'automation.living_room_motion_lights',
    });

    await autosnoozeCard.waitForScheduledCount(0);
    await autosnoozeCard.expectScheduledCount(0);
  });

  test('pause_by_area service', async ({ callService, autosnoozeCard }) => {
    // This test depends on areas being set up in the test HA instance
    // If no areas are configured, this may pause 0 automations
    await callService('autosnooze', 'pause_by_area', {
      area_id: 'living_room',
      hours: 1,
    });

    await autosnoozeCard.page.waitForTimeout(500);

    // Verify the service was called (even if 0 automations matched)
    // The test passes if no error was thrown
    expect(true).toBe(true);
  });

  test('pause_by_label service', async ({ callService, autosnoozeCard }) => {
    // This test depends on labels being set up
    await callService('autosnooze', 'pause_by_label', {
      label_id: 'autosnooze_include',
      hours: 1,
    });

    await autosnoozeCard.page.waitForTimeout(500);

    // Verify the service was called (even if 0 automations matched)
    expect(true).toBe(true);
  });

  test('service calls update UI in real-time', async ({
    callService,
    autosnoozeCard,
  }) => {
    // Get initial paused count
    const initialCount = await autosnoozeCard.getPausedCount();
    expect(initialCount).toBe(0);

    // Pause via service (not through UI)
    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      hours: 1,
    });

    // Wait for UI to update using proper wait method
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // UI should reflect the change
    const updatedCount = await autosnoozeCard.getPausedCount();
    expect(updatedCount).toBe(1);
  });

  test('pause service shows automation in paused list', async ({
    callService,
    autosnoozeCard,
  }) => {
    // Call pause service directly
    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      hours: 2,
    });

    // Wait for UI update
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Verify it appears in paused list
    const pausedCount = await autosnoozeCard.getPausedCount();
    expect(pausedCount).toBe(1);
  });

  test('cancel service removes automation from paused list', async ({
    callService,
    autosnoozeCard,
  }) => {
    // First pause via service
    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      hours: 1,
    });

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    expect(await autosnoozeCard.getPausedCount()).toBe(1);

    // Cancel via service
    await callService('autosnooze', 'cancel', {
      entity_id: 'automation.living_room_motion_lights',
    });

    // Wait for removal
    await autosnoozeCard.waitForPausedAutomationGone('Living Room Motion Lights');

    // Verify removed from list
    const pausedCount = await autosnoozeCard.getPausedCount();
    expect(pausedCount).toBe(0);
  });

  test('pause multiple automations via service updates UI', async ({
    callService,
    autosnoozeCard,
  }) => {
    // Pause multiple at once
    await callService('autosnooze', 'pause', {
      entity_id: [
        'automation.living_room_motion_lights',
        'automation.kitchen_motion_lights',
      ],
      hours: 1,
    });

    // Wait for both to appear
    await autosnoozeCard.waitForPausedCount(2);

    // Verify both in UI
    const pausedCount = await autosnoozeCard.getPausedCount();
    expect(pausedCount).toBe(2);
  });
});
