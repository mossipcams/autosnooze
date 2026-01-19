import { test, expect } from '../fixtures/hass.fixture';

test.describe('State Persistence', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture auto-executes: cancels all snoozes, clears labels, and resets automations
  });

  test('snoozed state persists across page reload', async ({ autosnoozeCard, page }) => {
    // Snooze an automation
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('4h');
    await autosnoozeCard.snooze();

    // Wait for paused item to appear
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);

    // Reload the page
    await page.reload();
    await autosnoozeCard.waitForCardReady();

    // Give time for state to be restored from persistence
    await page.waitForTimeout(1000);

    // Verify state is restored
    await autosnoozeCard.expectPausedCount(1);
  });

  test('multiple snoozed automations persist', async ({ autosnoozeCard, page }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectAutomation('Bedroom Motion Lights');
    await autosnoozeCard.selectDuration('2h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.expectPausedCount(3);

    await page.reload();
    await autosnoozeCard.waitForCardReady();

    // Give time for state to be restored from persistence
    await page.waitForTimeout(1000);

    await autosnoozeCard.expectPausedCount(3);
  });

  test('paused count updates after snooze via UI', async ({ autosnoozeCard }) => {
    // Initial state
    const initialCount = await autosnoozeCard.getPausedCount();
    expect(initialCount).toBe(0);

    // Snooze automations via UI
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    // Wait for UI to update
    await autosnoozeCard.expectPausedCount(2);

    // Verify count is now 2
    const updatedCount = await autosnoozeCard.getPausedCount();
    expect(updatedCount).toBe(2);
  });

  test('paused count decreases after wake', async ({ autosnoozeCard }) => {
    // Snooze an automation
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    expect(await autosnoozeCard.getPausedCount()).toBe(1);

    // Wake it
    await autosnoozeCard.wakeAutomation('Living Room Motion Lights');

    // Verify count decreased
    expect(await autosnoozeCard.getPausedCount()).toBe(0);
  });

  test('paused section shows countdown timers', async ({ autosnoozeCard }) => {
    // Snooze an automation
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('2h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Check that countdown is displayed
    const countdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
    expect(countdown).toBeTruthy();
    // Should contain time-related characters
    expect(countdown).toMatch(/\d+[hm]/);
  });
});
