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

  test('snooze with 4h preset', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectDuration('4h');
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
