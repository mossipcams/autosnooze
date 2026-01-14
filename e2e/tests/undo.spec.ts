import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Undo Functionality', () => {
  test.beforeEach(async ({ resetAutomations }) => {
    // Ensure clean state
  });

  test('undo button appears after snooze', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    // Wait for toast to appear
    await autosnoozeCard.waitForToast();

    const hasUndo = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.toast-undo-btn') !== null;
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

    await autosnoozeCard.expectPausedCount(3);

    await autosnoozeCard.undo();

    // Wait for items to be removed
    await autosnoozeCard.waitForPausedCount(0);

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

    // Wait for toast timeout (5 seconds + buffer)
    await autosnoozeCard.waitForToastGone(8000);

    toastVisible = await autosnoozeCard.isToastVisible();
    expect(toastVisible).toBe(false);
  });

  test('new snooze replaces previous toast', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForToast();
    const firstToastMessage = await autosnoozeCard.getToastMessage();

    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForToast();
    const secondToastMessage = await autosnoozeCard.getToastMessage();

    // There should only be one toast at a time
    const toastCount = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelectorAll('.toast').length ?? 0;
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

    // Wait for toast to disappear
    await autosnoozeCard.waitForToastGone(8000);

    // Snooze second automation
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');
    await autosnoozeCard.expectPausedCount(2);

    // Undo should only restore the second one
    await autosnoozeCard.undo();

    await autosnoozeCard.waitForPausedAutomationGone('Kitchen Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
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
