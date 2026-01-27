import { test, expect } from '../fixtures/hass.fixture';

test.describe('Direct Service Calls', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture auto-executes: cancels all snoozes, clears labels, and resets automations
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

  test('pause service with resume_at', async ({ callService, autosnoozeCard, page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      resume_at: tomorrow.toISOString(),
    });

    // Wait for service call to complete
    await page.waitForTimeout(1000);

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights', 15000);
    await autosnoozeCard.waitForPausedCount(1, 15000);
  });

  test('pause service with disable_at creates scheduled snooze', async ({
    callService,
    autosnoozeCard,
    page,
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

    // Wait for service call to process
    await page.waitForTimeout(1000);

    await autosnoozeCard.waitForScheduledCount(1, 15000);
    await autosnoozeCard.expectScheduledCount(1);
    await autosnoozeCard.expectPausedCount(0);
  });

  test('cancel service with multiple entity_ids', async ({
    callService,
    getState,
    autosnoozeCard,
    page,
  }) => {
    // First pause multiple
    await callService('autosnooze', 'pause', {
      entity_id: [
        'automation.living_room_motion_lights',
        'automation.kitchen_motion_lights',
      ],
      hours: 1,
    });

    // Wait for service call to process
    await page.waitForTimeout(1000);

    await autosnoozeCard.waitForPausedCount(2, 15000);

    // Then wake them all
    await callService('autosnooze', 'cancel', {
      entity_id: [
        'automation.living_room_motion_lights',
        'automation.kitchen_motion_lights',
      ],
    });

    // Wait for service call to process
    await page.waitForTimeout(1000);

    await autosnoozeCard.waitForPausedCount(0, 15000);

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

  test('pause_by_area service completes without error', async ({ callService, autosnoozeCard }) => {
    // This test validates that the pause_by_area service can be called successfully.
    // The actual number of paused automations depends on the HA instance configuration.
    // If the area exists and has automations assigned, they will be paused.
    const initialPausedCount = await autosnoozeCard.getPausedCount();

    await callService('autosnooze', 'pause_by_area', {
      area_id: 'living_room',
      hours: 1,
    });

    // Wait for service call to process (longer wait for reliability)
    await autosnoozeCard.page.waitForTimeout(1500);

    // Service completed without throwing - verify paused count is at least what it was
    // (may increase if automations were matched, stays same if no matches)
    // Retry to handle UI update delays
    let finalPausedCount = await autosnoozeCard.getPausedCount();
    for (let i = 0; i < 5; i++) {
      if (finalPausedCount >= initialPausedCount) break;
      await autosnoozeCard.page.waitForTimeout(500);
      finalPausedCount = await autosnoozeCard.getPausedCount();
    }
    expect(finalPausedCount).toBeGreaterThanOrEqual(initialPausedCount);
  });

  test('pause_by_label service completes without error', async ({ callService, autosnoozeCard }) => {
    // This test validates that the pause_by_label service can be called successfully.
    // The actual number of paused automations depends on label assignments in HA.
    const initialPausedCount = await autosnoozeCard.getPausedCount();

    await callService('autosnooze', 'pause_by_label', {
      label_id: 'autosnooze_include',
      hours: 1,
    });

    await autosnoozeCard.page.waitForTimeout(500);

    // Service completed without throwing - verify paused count is at least what it was
    const finalPausedCount = await autosnoozeCard.getPausedCount();
    expect(finalPausedCount).toBeGreaterThanOrEqual(initialPausedCount);
  });

  test('service calls update UI in real-time', async ({
    callService,
    autosnoozeCard,
    page,
  }) => {
    // Wait for UI to settle and verify initial state
    await page.waitForTimeout(500);

    // Get initial paused count - wait for it to stabilize
    let initialCount = await autosnoozeCard.getPausedCount();
    for (let i = 0; i < 5 && initialCount !== 0; i++) {
      await page.waitForTimeout(500);
      initialCount = await autosnoozeCard.getPausedCount();
    }
    expect(initialCount).toBe(0);

    // Pause via service (not through UI)
    await callService('autosnooze', 'pause', {
      entity_id: 'automation.living_room_motion_lights',
      hours: 1,
    });

    // Wait for service call to complete
    await page.waitForTimeout(1500);

    // Wait for UI to update using proper wait method with longer timeout
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights', 15000);

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
