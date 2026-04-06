import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('PR #329 Scheduled Lifecycle', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // Fixture reset runs automatically.
  });

  test('scheduled snoozes survive reload and can be canceled from the card UI', async ({
    autosnoozeCard,
    callService,
    page,
  }) => {
    const disableAt = new Date();
    disableAt.setDate(disableAt.getDate() + 1);
    disableAt.setHours(9, 0, 0, 0);

    const resumeAt = new Date(disableAt);
    resumeAt.setHours(12, 0, 0, 0);

    await callService('autosnooze', 'pause', {
      entity_id: 'automation.kitchen_motion_lights',
      disable_at: disableAt.toISOString(),
      resume_at: resumeAt.toISOString(),
    });

    const getScheduledItemTexts = async () =>
      page.evaluate(
        `
        (() => {
          ${findCardScript}
          const card = findAutosnoozeCard();
          return deepQueryAll(card, '.scheduled-item')
            .map((item) => item.textContent?.trim() ?? '')
            .filter(Boolean);
        })()
        `
      );

    await autosnoozeCard.waitForScheduledCount(1, 15000);
    await autosnoozeCard.expectScheduledCount(1);
    expect(await getScheduledItemTexts()).toContainEqual(expect.stringContaining('Kitchen Motion Lights'));

    await page.reload();
    await autosnoozeCard.waitForCardReady();
    await autosnoozeCard.waitForScheduledCount(1, 15000);
    expect(await getScheduledItemTexts()).toContainEqual(expect.stringContaining('Kitchen Motion Lights'));

    await autosnoozeCard.cancelScheduled('Kitchen Motion Lights');

    await autosnoozeCard.expectScheduledCount(0);
    expect(await autosnoozeCard.getPausedCount()).toBe(0);
  });
});
