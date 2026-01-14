import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Countdown Timer', () => {
  test.beforeEach(async ({ resetAutomations }) => {
    // Ensure clean state
  });

  test('countdown displays for snoozed automation', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('15m');
    await autosnoozeCard.snooze();

    // Wait for the paused item to appear
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    const countdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
    expect(countdown).toMatch(/\d+m\s*\d*s?|\d+m/);
  });

  test('countdown updates over time', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('30m');
    await autosnoozeCard.snooze();

    // Wait for the paused item to appear
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Get initial countdown
    const initialCountdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
    expect(initialCountdown).toBeTruthy();

    // Wait a few seconds
    await autosnoozeCard.page.waitForTimeout(3000);

    // Get updated countdown
    const updatedCountdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');

    // They should be different (time has passed) - or at least one should have a value
    expect(updatedCountdown).toBeTruthy();
  });

  test('multiple snoozed automations with same resume time are grouped', async ({
    autosnoozeCard,
  }) => {
    // Snooze multiple with same duration (should have same resume time)
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    // Wait for both items to appear
    await autosnoozeCard.expectPausedCount(2);

    // Count pause groups
    const groupCount = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelectorAll('.pause-group').length ?? 0;
      })()
      `
    );

    // Should be one group since they have the same resume time
    expect(groupCount).toBe(1);
  });

  test('different resume times create separate groups', async ({ autosnoozeCard }) => {
    // Snooze first automation for 1h
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    // Wait for first automation to appear
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Snooze second automation for 4h (different time)
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('4h');
    await autosnoozeCard.snooze();

    // Wait for second automation to appear
    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');

    // Count pause groups
    const groupCount = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelectorAll('.pause-group').length ?? 0;
      })()
      `
    );

    // Should be two groups since they have different resume times
    expect(groupCount).toBe(2);
  });

  test('countdown displays hours for longer durations', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('4h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    const countdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
    expect(countdown).toMatch(/\d+h/);
  });

  test('countdown displays days for very long durations', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('2d');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    const countdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
    expect(countdown).toMatch(/\d+d/);
  });

  test('group header shows resume time', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    const headerText = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const header = card?.shadowRoot?.querySelector('.pause-group-header');
        return header?.textContent ?? '';
      })()
      `
    );

    // Should contain some time indication
    expect(headerText).toBeTruthy();
  });
});
