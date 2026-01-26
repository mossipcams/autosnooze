import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Wake Operations', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture auto-executes: cancels all snoozes, clears labels, and resets automations
  });

  test('wake individual automation', async ({ autosnoozeCard, getState }) => {
    // First snooze an automation
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);

    // Wake it
    await autosnoozeCard.wakeAutomation('Living Room Motion Lights');

    await autosnoozeCard.expectPausedCount(0);

    const state = await getState('automation.living_room_motion_lights');
    expect(state).toBe('on');
  });

  test('wake from multiple paused automations', async ({ autosnoozeCard }) => {
    // Snooze multiple automations
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectAutomation('Bedroom Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.expectPausedCount(3);

    // Wake one
    await autosnoozeCard.wakeAutomation('Kitchen Motion Lights');

    await autosnoozeCard.expectPausedCount(2);
  });

  test('wake all requires double-click confirmation', async ({ autosnoozeCard }) => {
    // Snooze multiple automations
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.expectPausedCount(2);

    // First click - should show confirmation text
    await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.wake-all');
        btn?.click();
      })()
      `
    );
    await autosnoozeCard.page.waitForTimeout(200);

    // Check button text changed to confirm
    const buttonText = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.wake-all')?.textContent?.trim() ?? '';
      })()
      `
    );
    expect(buttonText.toLowerCase()).toContain('confirm');

    // Second click - execute
    await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.wake-all');
        btn?.click();
      })()
      `
    );

    // Wait for all paused items to be removed
    await autosnoozeCard.waitForPausedCount(0);

    await autosnoozeCard.expectPausedCount(0);
  });

  test('wake all confirmation times out', async ({ autosnoozeCard }) => {
    // Snooze automations
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);

    // First click
    await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.wake-all');
        btn?.click();
      })()
      `
    );
    await autosnoozeCard.page.waitForTimeout(500);

    // Wait for timeout (3 seconds + buffer) - use longer timeout for reliability
    await autosnoozeCard.page.waitForTimeout(4000);

    // Button text should reset - retry to handle rendering delays
    let buttonText = '';
    let retries = 0;
    while (retries < 5) {
      buttonText = await autosnoozeCard.page.evaluate(
        `
        (() => {
          ${findCardScript}
          const card = findAutosnoozeCard();
          return card?.shadowRoot?.querySelector('.wake-all')?.textContent?.trim() ?? '';
        })()
        `
      );
      if (!buttonText.toLowerCase().includes('confirm')) break;
      await autosnoozeCard.page.waitForTimeout(500);
      retries++;
    }
    expect(buttonText.toLowerCase()).not.toContain('confirm');
  });

  test('wake button appears for each paused automation', async ({ autosnoozeCard }) => {
    // Snooze multiple automations
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.expectPausedCount(2);

    // Each paused item should have a wake button
    const wakeButtonCount = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const pausedItems = card?.shadowRoot?.querySelectorAll('.paused-item');
        let count = 0;
        pausedItems?.forEach(item => {
          if (item.querySelector('.wake-btn')) count++;
        });
        return count;
      })()
      `
    );

    expect(wakeButtonCount).toBe(2);
  });

  test('paused section appears when there are paused automations', async ({ autosnoozeCard }) => {
    // Initially no paused section visible
    await autosnoozeCard.expectPausedCount(0);

    let pausedSectionVisible = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        // Check for paused items container or pause-groups
        const pausedItems = card?.shadowRoot?.querySelectorAll('.paused-item');
        return (pausedItems?.length ?? 0) > 0;
      })()
      `
    );
    expect(pausedSectionVisible).toBe(false);

    // Snooze an automation
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Paused section should now be visible with items
    pausedSectionVisible = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const pausedItems = card?.shadowRoot?.querySelectorAll('.paused-item');
        return (pausedItems?.length ?? 0) > 0;
      })()
      `
    );
    expect(pausedSectionVisible).toBe(true);
  });
});
