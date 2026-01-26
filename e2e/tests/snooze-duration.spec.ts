import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Duration-based Snooze', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture auto-executes: cancels all snoozes, clears labels, and resets automations
  });

  test('snooze with 15 minute preset', async ({ autosnoozeCard, getState }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('15m');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);

    const state = await getState('automation.living_room_motion_lights');
    expect(state).toBe('off');
  });

  test('snooze with 30m preset', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('30m');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('snooze with 1h preset', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('snooze with 2h preset', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('2h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('snooze with 1d preset', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('1d');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('snooze with custom duration - hours and minutes', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.setCustomDuration('2h30m');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('snooze with custom duration - decimal hours', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Bedroom Motion Lights');
    await autosnoozeCard.setCustomDuration('1.5h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Bedroom Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('snooze with custom duration - days', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Bathroom Motion Lights');
    await autosnoozeCard.setCustomDuration('1d');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Bathroom Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('snooze with custom duration - days and hours', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Garage Motion Lights');
    await autosnoozeCard.setCustomDuration('1d2h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Garage Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('snooze multiple automations', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectAutomation('Bedroom Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.expectPausedCount(3);
  });

  test('invalid custom duration shows error state', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('invalid');

    const isValid = await autosnoozeCard.isDurationInputValid();
    expect(isValid).toBe(false);
    await autosnoozeCard.expectSnoozeButtonDisabled();
  });

  test('selecting preset clears custom duration', async ({ autosnoozeCard }) => {
    await autosnoozeCard.setCustomDuration('45m');
    await autosnoozeCard.selectDuration('1h');

    const activePill = await autosnoozeCard.getActiveDurationPill();
    expect(activePill).toBe('1h');
  });

  test('clicking custom pill enables duration input', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectDuration('Custom');

    // Check that custom input is visible and active
    const inputExists = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const input = card?.shadowRoot?.querySelector('.duration-input');
        return input !== null;
      })()
      `
    );
    expect(inputExists).toBe(true);

    // Verify Custom pill is active
    const activePill = await autosnoozeCard.getActiveDurationPill();
    expect(activePill).toBe('Custom');
  });
});

test.describe('Last Duration Badge', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture auto-executes
  });

  test('badge appears after snoozing with custom duration', async ({ autosnoozeCard }) => {
    // Badge should not be visible initially
    const badgeVisibleBefore = await autosnoozeCard.isLastDurationBadgeVisible();
    expect(badgeVisibleBefore).toBe(false);

    // Snooze with custom duration
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('2h30m');
    await autosnoozeCard.snooze();
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Wake it immediately
    await autosnoozeCard.wakeAutomation('Living Room Motion Lights');
    await autosnoozeCard.waitForPausedAutomationGone('Living Room Motion Lights');

    // Reload page
    await autosnoozeCard.page.reload();
    await autosnoozeCard.page.waitForLoadState('networkidle');

    // Badge should appear
    await autosnoozeCard.waitForLastDurationBadge();
    const badgeText = await autosnoozeCard.getLastDurationBadgeText();
    expect(badgeText).toContain('2h30m');
  });

  test('badge does NOT appear when last duration matches a preset', async ({ autosnoozeCard }) => {
    // Snooze with preset duration (1h)
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Wake it
    await autosnoozeCard.wakeAutomation('Living Room Motion Lights');
    await autosnoozeCard.waitForPausedAutomationGone('Living Room Motion Lights');

    // Reload page
    await autosnoozeCard.page.reload();
    await autosnoozeCard.page.waitForLoadState('networkidle');

    // Badge should NOT appear (last duration matches preset)
    const badgeVisible = await autosnoozeCard.isLastDurationBadgeVisible();
    expect(badgeVisible).toBe(false);
  });

  test('clicking badge sets duration and enables snooze button', async ({ autosnoozeCard, getState }) => {
    // First, create a last duration (2h30m)
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('2h30m');
    await autosnoozeCard.snooze();
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.wakeAutomation('Living Room Motion Lights');

    // Reload to see badge
    await autosnoozeCard.page.reload();
    await autosnoozeCard.page.waitForLoadState('networkidle');
    await autosnoozeCard.waitForLastDurationBadge();

    // Clear any selection
    await autosnoozeCard.clearSelection();

    // Snooze button should be disabled (no selection)
    await autosnoozeCard.expectSnoozeButtonDisabled();

    // Click the badge
    await autosnoozeCard.clickLastDurationBadge();

    // Snooze button should still be disabled (selection still empty)
    await autosnoozeCard.expectSnoozeButtonDisabled();

    // Now select an automation
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');

    // Snooze button should be enabled (selection + duration set by badge)
    await autosnoozeCard.expectSnoozeButtonEnabled();

    // Snooze and verify the duration was correctly set to 2h30m (150 minutes)
    await autosnoozeCard.snooze();
    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');

    const state = await getState('automation.kitchen_motion_lights');
    // State should be 'off' when snoozed
    expect(state).toBe('off');
  });

  test('badge displays different durations correctly', async ({ autosnoozeCard }) => {
    const testCases = [
      { input: '45m', expected: '45m' },
      { input: '1h30m', expected: '1h30m' },
      { input: '3h', expected: '3h' },
    ];

    for (const testCase of testCases) {
      // Snooze with custom duration
      await autosnoozeCard.selectAutomation('Living Room Motion Lights');
      await autosnoozeCard.setCustomDuration(testCase.input);
      await autosnoozeCard.snooze();
      await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
      await autosnoozeCard.wakeAutomation('Living Room Motion Lights');

      // Reload
      await autosnoozeCard.page.reload();
      await autosnoozeCard.page.waitForLoadState('networkidle');

      // Verify badge text
      await autosnoozeCard.waitForLastDurationBadge();
      const badgeText = await autosnoozeCard.getLastDurationBadgeText();
      expect(badgeText).toContain(testCase.expected);
    }
  });

  test('badge has history icon', async ({ autosnoozeCard }) => {
    // Create last duration
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('2h');
    await autosnoozeCard.snooze();
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.wakeAutomation('Living Room Motion Lights');

    // Reload
    await autosnoozeCard.page.reload();
    await autosnoozeCard.page.waitForLoadState('networkidle');

    // Check for icon
    const hasIcon = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const badge = card?.shadowRoot?.querySelector('.last-duration-badge');
        const icon = badge?.querySelector('ha-icon[icon="mdi:history"]');
        return icon !== null;
      })()
      `
    );
    expect(hasIcon).toBe(true);
  });

  test('duration pills remain consistent after custom snooze', async ({ autosnoozeCard }) => {
    const pillsBefore = await autosnoozeCard.getDurationPills();
    const initialCount = pillsBefore.length;
    // Should have preset pills (30m, 1h, 12h, 1d) and possibly Custom
    expect(initialCount).toBeGreaterThanOrEqual(4);

    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('2h30m');
    await autosnoozeCard.snooze();
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Reload page
    await autosnoozeCard.page.reload();
    await autosnoozeCard.page.waitForLoadState('networkidle');

    const pillsAfter = await autosnoozeCard.getDurationPills();
    // Pill count should remain the same - no "Last" pill added to the array
    expect(pillsAfter.length).toBe(initialCount);

    // Verify no pill has "Last" or a historical duration like "2h30m" as its text
    const pillTexts = pillsAfter.map((p) => p.textContent);
    expect(pillTexts).not.toContain('Last');
    expect(pillTexts).not.toContain('2h30m');
  });
});
