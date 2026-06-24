/**
 * README
 *
 * Covers AutoSnooze card registration, card resource loading, card-origin console/page errors,
 * layout integrity, and the baseline loaded-card visual snapshot on the existing HA dashboard.
 *
 * Update snapshots with:
 * npm run e2e:visual -- --update-snapshots e2e/tests/card-load.visual.spec.ts
 *
 * Commit the generated *-snapshots directory with intentional visual changes.
 */
import { authenticatedVisualTest as test, expect } from '../helpers/fixtures';
import {
  CARD_ELEMENT_NAME,
  EXISTING_DASHBOARD_PATH,
  assertNoCardErrors,
  ensureCardResourceRegistered,
  expectCardReady,
  installCardErrorListeners,
  loadCardResource,
  setState,
  verifyCardResource,
} from '../helpers/ha';
import {
  assertLayoutIntegrity,
  freezeTime,
  screenshotOptions,
  stabilizeForVisualSnapshot,
  volatileRegionMasks,
} from '../helpers/visual';

const AUTOSNOOZE_STATUS_ENTITY_ID = 'sensor.autosnooze_snoozed_automations';

test.describe('Card registration and load @visual @critical', () => {
  test('loads the registered card without visual defects @visual @critical', async ({ page }) => {
    await test.step('freeze time and attach card error listeners', async () => {
      await freezeTime(page);
    });
    const monitor = installCardErrorListeners(page);

    await test.step('navigate to the existing visual dashboard', async () => {
      await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });
    });

    await test.step('ensure the Lovelace card resource is registered', async () => {
      await ensureCardResourceRegistered(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
    });

    await test.step('verify the card JavaScript resource is served as JavaScript', async () => {
      await verifyCardResource(page);
    });

    await test.step('assert the custom element is registered', async () => {
      await loadCardResource(page);
      await expect
        .poll(() => page.evaluate((name) => Boolean(customElements.get(name)), CARD_ELEMENT_NAME))
        .toBe(true);
    });

    const card = await test.step('wait for the visible AutoSnooze card', async () => {
      const loadedCard = await expectCardReady(page);
      await setState(page, AUTOSNOOZE_STATUS_ENTITY_ID, 'idle', {
        friendly_name: 'AutoSnooze Status',
      });
      await expect(loadedCard.locator('.sensor-health-banner')).toHaveCount(0);
      return loadedCard;
    });

    await test.step('assert card-local layout integrity', async () => {
      await assertLayoutIntegrity(card);
    });

    await test.step('capture the loaded card visual baseline', async () => {
      await stabilizeForVisualSnapshot(page, card);
      await expect(card).toHaveScreenshot('card-load-default.png', {
        ...screenshotOptions,
        mask: volatileRegionMasks(card),
      });
    });

    await test.step('fail on card-origin console, page, and resource errors', async () => {
      assertNoCardErrors(monitor);
    });
  });
});
