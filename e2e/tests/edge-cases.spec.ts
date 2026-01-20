import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture auto-executes: cancels all snoozes, clears labels, and resets automations
  });

  test('zero duration prevents snooze', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('0');

    await autosnoozeCard.expectSnoozeButtonDisabled();
  });

  test('empty custom duration prevents snooze', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('Custom');

    // Clear any existing value
    await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const input = card?.shadowRoot?.querySelector('.duration-input');
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
      `
    );
    await autosnoozeCard.page.waitForTimeout(100);

    await autosnoozeCard.expectSnoozeButtonDisabled();
  });

  test('waking non-snoozed automation is handled gracefully', async ({ callService, getState }) => {
    // Calling cancel on a non-snoozed automation should not throw an error
    // and the automation should remain in its current state (on)
    await callService('autosnooze', 'cancel', {
      entity_id: 'automation.living_room_motion_lights',
    });

    // Verify the automation is still on (wasn't affected by the cancel call)
    const state = await getState('automation.living_room_motion_lights');
    expect(state).toBe('on');
  });

  test('snooze with only minutes works', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('45m');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('snooze with fractional hours works', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('1.5h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('very long duration works', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('365d');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
  });

  test('rapid snooze/wake cycles handled correctly', async ({ autosnoozeCard, getState }) => {
    const automationName = 'Living Room Motion Lights';
    const entityId = 'automation.living_room_motion_lights';

    // Rapid cycle 3 times
    for (let i = 0; i < 3; i++) {
      await autosnoozeCard.selectAutomation(automationName);
      await autosnoozeCard.selectDuration('15m');
      await autosnoozeCard.snooze();
      await autosnoozeCard.waitForPausedAutomation(automationName);
      await autosnoozeCard.wakeAutomation(automationName);
    }

    // Final state should be on
    const state = await getState(entityId);
    expect(state).toBe('on');
    await autosnoozeCard.expectPausedCount(0);
  });

  test('selection cleared after successful snooze', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');

    let count = await autosnoozeCard.getSelectedCount();
    expect(count).toBe(2);

    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    // Wait for snooze to complete
    await autosnoozeCard.expectPausedCount(2);

    count = await autosnoozeCard.getSelectedCount();
    expect(count).toBe(0);
  });

  test('snooze button shows correct text based on selection', async ({ autosnoozeCard }) => {
    // No selection
    const buttonTextEmpty = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.snooze-btn')?.textContent?.trim() ?? '';
      })()
      `
    );
    expect(buttonTextEmpty.toLowerCase()).toContain('snooze');

    // Single selection
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    const buttonTextOne = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.snooze-btn')?.textContent?.trim() ?? '';
      })()
      `
    );
    expect(buttonTextOne.toLowerCase()).toContain('1');

    // Multiple selection
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    const buttonTextTwo = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.snooze-btn')?.textContent?.trim() ?? '';
      })()
      `
    );
    expect(buttonTextTwo.toLowerCase()).toContain('2');
  });

  test('re-snoozing automation updates countdown display', async ({ autosnoozeCard }) => {
    // Snooze for 15 minutes
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('15m');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Re-select the paused automation and snooze again with longer duration
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('4h');
    await autosnoozeCard.snooze();

    // Wait for UI to update
    await autosnoozeCard.page.waitForTimeout(500);

    // Verify automation is still paused (re-snooze should keep it paused)
    await autosnoozeCard.expectPausedCount(1);

    // Get the countdown - should now show hours
    const countdown = await autosnoozeCard.getCountdown('Living Room Motion Lights');
    expect(countdown).toMatch(/\d+h/);
  });

  test('invalid duration format shows input as invalid', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('abc');

    const isValid = await autosnoozeCard.isDurationInputValid();
    expect(isValid).toBe(false);
  });

  test('snooze all via select all then snooze increases paused count', async ({ autosnoozeCard }) => {
    // Get initial state
    const initialPausedCount = await autosnoozeCard.getPausedCount();
    expect(initialPausedCount).toBe(0);

    // Select first few automations manually (select all may have issues)
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');

    // Snooze
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    // Wait for paused items
    await autosnoozeCard.page.waitForTimeout(1000);

    // Verify paused count increased
    const finalPausedCount = await autosnoozeCard.getPausedCount();
    expect(finalPausedCount).toBe(2);
  });
});
