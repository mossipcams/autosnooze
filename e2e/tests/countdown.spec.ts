import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Countdown Timer', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture auto-executes: cancels all snoozes, clears labels, and resets automations
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
    test.setTimeout(45000);

    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('30m');
    await autosnoozeCard.snooze();

    // Wait for the paused item to appear with extended timeout
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights', 20000);

    // Wait for pause-group countdown element to be rendered with content
    await autosnoozeCard.page.waitForFunction(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const countdown = deepQuery(card, '.pause-group .countdown');
        // Ensure countdown has actual time content (contains 'm' for minutes)
        return countdown && countdown.textContent?.trim().length > 0 && /\\d+m/.test(countdown.textContent);
      })()
      `,
      { timeout: 20000 }
    );

    // Parse the countdown to extract seconds (format: "29m 45s" or "29m")
    const parseCountdownSeconds = (countdown: string): number => {
      const minuteMatch = countdown.match(/(\d+)m/);
      const secondMatch = countdown.match(/(\d+)s/);
      const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
      const seconds = secondMatch ? parseInt(secondMatch[1], 10) : 0;
      return minutes * 60 + seconds;
    };

    // Get initial countdown (retry with more attempts for slow browsers)
    let initialCountdown = '';
    let retries = 0;
    while (retries < 15 && !initialCountdown.match(/\d+m/)) {
      await autosnoozeCard.page.waitForTimeout(400);
      initialCountdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
      retries++;
    }
    expect(initialCountdown).toBeTruthy();
    const initialSeconds = parseCountdownSeconds(initialCountdown);

    // Wait for countdown to update (countdown updates every second)
    await autosnoozeCard.page.waitForTimeout(4000);

    // Get updated countdown (retry with more attempts)
    let updatedCountdown = '';
    retries = 0;
    while (retries < 10 && !updatedCountdown) {
      await autosnoozeCard.page.waitForTimeout(300);
      updatedCountdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
      retries++;
    }
    expect(updatedCountdown).toBeTruthy();

    const updatedSeconds = parseCountdownSeconds(updatedCountdown);

    // The countdown should have decreased by at least 2 seconds
    expect(updatedSeconds).toBeLessThan(initialSeconds);
    expect(initialSeconds - updatedSeconds).toBeGreaterThanOrEqual(2);
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
        return deepQueryAll(card, '.pause-group').length ?? 0;
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
    await autosnoozeCard.setCustomDuration('4h');
    await autosnoozeCard.snooze();

    // Wait for second automation to appear
    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');

    // Wait for both automations to be in paused list
    await autosnoozeCard.expectPausedCount(2);

    // Wait for UI to fully render groups (groups are re-calculated on render)
    await autosnoozeCard.page.waitForTimeout(1000);

    // Count pause groups - retry a few times to handle rendering delays
    let groupCount = 0;
    for (let i = 0; i < 5; i++) {
      groupCount = await autosnoozeCard.page.evaluate(
        `
        (() => {
          ${findCardScript}
          const card = findAutosnoozeCard();
          return deepQueryAll(card, '.pause-group').length ?? 0;
        })()
        `
      );
      if (groupCount === 2) break;
      await autosnoozeCard.page.waitForTimeout(500);
    }

    // Should be two groups since they have different resume times
    expect(groupCount).toBe(2);
  });

  test('countdown displays hours for longer durations', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('4h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Wait for pause-group countdown element to be rendered
    await autosnoozeCard.page.waitForFunction(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const countdown = deepQuery(card, '.pause-group .countdown');
        return countdown && countdown.textContent?.trim().length > 0;
      })()
      `,
      { timeout: 15000 }
    );

    // Wait for countdown to render (retry with more attempts)
    let countdown = '';
    let retries = 0;
    while (retries < 10 && !countdown.match(/\d+h/)) {
      await autosnoozeCard.page.waitForTimeout(300);
      countdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
      retries++;
    }
    expect(countdown).toMatch(/\d+h/);
  });

  test('countdown displays days for very long durations', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('2d');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Wait for pause-group countdown element to be rendered
    await autosnoozeCard.page.waitForFunction(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const countdown = deepQuery(card, '.pause-group .countdown');
        return countdown && countdown.textContent?.trim().length > 0;
      })()
      `,
      { timeout: 15000 }
    );

    // Wait for countdown to render (retry with more attempts)
    let countdown = '';
    let retries = 0;
    while (retries < 10 && !countdown.match(/\d+d/)) {
      await autosnoozeCard.page.waitForTimeout(300);
      countdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
      retries++;
    }
    expect(countdown).toMatch(/\d+d/);
  });

  test('group header shows resume time', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Wait for pause-group header to be rendered
    await autosnoozeCard.page.waitForFunction(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const header = deepQuery(card, '.pause-group-header');
        return header && header.textContent?.trim().length > 0;
      })()
      `,
      { timeout: 15000 }
    );

    // Retry getting header text
    let headerText = '';
    for (let i = 0; i < 10; i++) {
      headerText = await autosnoozeCard.page.evaluate(
        `
        (() => {
          ${findCardScript}
          const card = findAutosnoozeCard();
          const header = deepQuery(card, '.pause-group-header');
          return header?.textContent ?? '';
        })()
        `
      );
      if (headerText.trim()) break;
      await autosnoozeCard.page.waitForTimeout(300);
    }

    // Should contain some time indication
    expect(headerText).toBeTruthy();
  });
});
