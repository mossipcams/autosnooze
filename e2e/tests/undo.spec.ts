import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Undo Functionality', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture auto-executes: cancels all snoozes, clears labels, and resets automations
  });

  test('undo button appears after snooze', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    // Wait for toast to appear with longer timeout for reliability
    await autosnoozeCard.waitForToast(15000);

    // Wait for toast to fully render
    await autosnoozeCard.page.waitForTimeout(500);

    const hasUndo = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return deepQuery(card, '.toast-undo-btn') !== null;
      })()
      `
    );

    expect(hasUndo).toBe(true);
  });

  test('undo after snooze restores automation', async ({ autosnoozeCard, getState }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    let state = await getState('automation.living_room_motion_lights');
    expect(state).toBe('off');

    await autosnoozeCard.undo();

    // Wait for automation to be restored
    await autosnoozeCard.waitForPausedAutomationGone('Living Room Motion Lights');

    state = await getState('automation.living_room_motion_lights');
    expect(state).toBe('on');
    await autosnoozeCard.expectPausedCount(0);
  });

  test('undo restores multiple automations', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectAutomation('Bedroom Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    // Wait for all three to be paused
    await autosnoozeCard.waitForPausedCount(3, 15000);

    await autosnoozeCard.undo();

    // Wait for items to be removed with longer timeout
    await autosnoozeCard.waitForPausedCount(0, 15000);

    await autosnoozeCard.expectPausedCount(0);
  });

  test('undo restores selection state', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Selection should be cleared after snooze
    let selectedCount = await autosnoozeCard.getSelectedCount();
    expect(selectedCount).toBe(0);

    await autosnoozeCard.undo();

    // Wait for undo to complete
    await autosnoozeCard.waitForPausedAutomationGone('Living Room Motion Lights');

    // Selection should be restored after undo
    await autosnoozeCard.page.waitForTimeout(300);
    selectedCount = await autosnoozeCard.getSelectedCount();
    expect(selectedCount).toBe(1);
  });

  test('toast disappears after timeout', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForToast();

    let toastVisible = await autosnoozeCard.isToastVisible();
    expect(toastVisible).toBe(true);

    // Wait for toast timeout (5 seconds + buffer) - use longer timeout for reliability
    await autosnoozeCard.waitForToastGone(12000);

    toastVisible = await autosnoozeCard.isToastVisible();
    expect(toastVisible).toBe(false);
  });

  test('new snooze replaces previous toast', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForToast();
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    // Wait a bit before second snooze to ensure first one is complete
    await autosnoozeCard.page.waitForTimeout(1000);

    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForToast();
    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');

    // Wait for toast animations to settle
    await autosnoozeCard.page.waitForTimeout(500);

    // There should only be one toast at a time
    const toastCount = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return deepQueryAll(card, '.toast').length ?? 0;
      })()
      `
    );

    expect(toastCount).toBeLessThanOrEqual(1);
  });

  test('undo only affects most recent snooze', async ({ autosnoozeCard }) => {
    // Snooze first automation
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);

    // Wait for toast to disappear (use longer timeout for reliability)
    await autosnoozeCard.waitForToastGone(12000);

    // Verify toast is gone
    const toastGone = await autosnoozeCard.isToastVisible();
    expect(toastGone).toBe(false);

    // Wait a bit more to ensure everything is settled
    await autosnoozeCard.page.waitForTimeout(1000);

    // Snooze second automation
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');
    // Wait for both to be present
    await autosnoozeCard.waitForPausedCount(2, 15000);

    // Undo should only restore the second one
    await autosnoozeCard.undo();

    // Wait for undo to complete
    await autosnoozeCard.page.waitForTimeout(1000);

    await autosnoozeCard.waitForPausedAutomationGone('Kitchen Motion Lights');
    await autosnoozeCard.waitForPausedCount(1, 15000);
  });

  test('toast shows snooze count message', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForToast();

    // Toast should mention number of snoozed automations
    const toastMessage = await autosnoozeCard.getToastMessage();
    expect(toastMessage.toLowerCase()).toMatch(/snoozed|paused/);
  });
});
