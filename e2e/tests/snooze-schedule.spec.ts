import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';
import { getScheduleDateTime } from '../helpers/time-utils';

test.describe('Schedule Mode Snooze', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture auto-executes: cancels all snoozes, clears labels, and resets automations
  });

  test('switch to schedule mode shows datetime inputs', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToScheduleMode();

    const hasScheduleInputs = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const disableDate = card?.shadowRoot?.querySelector('select[aria-label="Snooze date"]');
        const resumeDate = card?.shadowRoot?.querySelector('select[aria-label="Resume date"]');
        return disableDate !== null && resumeDate !== null;
      })()
      `
    );

    expect(hasScheduleInputs).toBe(true);
  });

  test('schedule immediate snooze until future time', async ({ autosnoozeCard, getState }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.switchToScheduleMode();

    const resumeAt = getScheduleDateTime(1, 14, 0);
    await autosnoozeCard.setSchedule({ resumeAt });

    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);

    const state = await getState('automation.living_room_motion_lights');
    expect(state).toBe('off');
  });

  test('switch back to duration mode', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToScheduleMode();
    await autosnoozeCard.switchToDurationMode();

    const hasDurationPills = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.duration-pills') !== null;
      })()
      `
    );

    expect(hasDurationPills).toBe(true);
  });

  test('schedule mode without disable_at snoozes immediately', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.switchToScheduleMode();

    const resumeAt = getScheduleDateTime(1, 18, 0);
    await autosnoozeCard.setSchedule({ resumeAt });

    await autosnoozeCard.snooze();

    // Without disable_at, should snooze immediately
    await autosnoozeCard.waitForPausedAutomation('Kitchen Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
    await autosnoozeCard.expectScheduledCount(0);
  });

  test('schedule mode UI elements are present', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToScheduleMode();

    // Check for date and time inputs
    const hasScheduleUI = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const scheduleInputs = card?.shadowRoot?.querySelector('.schedule-inputs');
        const resumeDate = card?.shadowRoot?.querySelector('select[aria-label="Resume date"]');
        const resumeTime = card?.shadowRoot?.querySelector('input[aria-label="Resume time"]');
        return {
          hasScheduleInputs: scheduleInputs !== null,
          hasResumeDate: resumeDate !== null,
          hasResumeTime: resumeTime !== null,
        };
      })()
      `
    );

    expect(hasScheduleUI.hasScheduleInputs).toBe(true);
    expect(hasScheduleUI.hasResumeDate).toBe(true);
    expect(hasScheduleUI.hasResumeTime).toBe(true);
  });

  test('switching between schedule and duration modes preserves selection', async ({ autosnoozeCard }) => {
    // Select an automation
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');

    // Verify selection
    let selectedCount = await autosnoozeCard.getSelectedCount();
    expect(selectedCount).toBe(1);

    // Switch to schedule mode
    await autosnoozeCard.switchToScheduleMode();

    // Selection should persist
    selectedCount = await autosnoozeCard.getSelectedCount();
    expect(selectedCount).toBe(1);

    // Switch back to duration mode
    await autosnoozeCard.switchToDurationMode();

    // Selection should still persist
    selectedCount = await autosnoozeCard.getSelectedCount();
    expect(selectedCount).toBe(1);
  });

  test('schedule link text changes based on mode', async ({ autosnoozeCard }) => {
    // In duration mode, link should mention "schedule"
    const durationModeLink = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const link = card?.shadowRoot?.querySelector('.schedule-link');
        return link?.textContent?.trim() ?? '';
      })()
      `
    );
    expect(durationModeLink.toLowerCase()).toContain('pick');

    // Switch to schedule mode
    await autosnoozeCard.switchToScheduleMode();

    // Link should now mention going back
    const scheduleModeLink = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const link = card?.shadowRoot?.querySelector('.schedule-link');
        return link?.textContent?.trim() ?? '';
      })()
      `
    );
    expect(scheduleModeLink.toLowerCase()).toContain('back');
  });
});
