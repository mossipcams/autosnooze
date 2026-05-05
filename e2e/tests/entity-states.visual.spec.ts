/**
 * README
 *
 * Covers visual rendering for automation entities in unavailable, unknown, normal, long,
 * stale, missing-attribute, missing-state, and permission-denied-like conditions on the
 * existing HA dashboard. These tests mutate the browser's loaded HA state object because
 * this repo intentionally uses the existing external HA instance instead of provisioning
 * a deterministic Docker fixture.
 *
 * Update snapshots with:
 * npm run e2e:visual -- --update-snapshots e2e/tests/entity-states.visual.spec.ts
 *
 * Commit the generated *-snapshots directory with intentional visual changes.
 *
 * Assumptions:
 * - AutoSnooze does not accept a configured entity option; configured-entity-missing is
 *   represented by filtering to an entity that is absent from HA state.
 * - Permission-denied-like-missing-state is represented by removing the state from the
 *   browser model while keeping the dashboard and card loaded.
 */
import { Locator, Page } from '@playwright/test';
import { authenticatedVisualTest as test, expect } from '../helpers/fixtures';
import {
  EXISTING_DASHBOARD_PATH,
  assertNoCardErrors,
  expectCardReady,
  installCardErrorListeners,
  setState,
  waitForHassStateRegistry,
} from '../helpers/ha';
import {
  assertLayoutIntegrity,
  freezeTime,
  screenshotOptions,
  stabilizeForVisualSnapshot,
  volatileRegionMasks,
} from '../helpers/visual';

type EntityScenario = {
  name: string;
  entityId: string;
  state?: string;
  friendlyName?: string;
  attributes?: Record<string, unknown>;
  lastUpdated?: string;
  removeState?: boolean;
  search: string;
};

const LONG_TEXT = 'AutoSnooze Visual Regression Automation With An Extremely Long Friendly Name That Must Wrap Cleanly';

const ENTITY_STATE_SCENARIOS: EntityScenario[] = [
  {
    name: 'unavailable',
    entityId: 'automation.visual_unavailable',
    state: 'unavailable',
    friendlyName: 'Visual Unavailable Automation',
    search: 'Visual Unavailable Automation',
  },
  {
    name: 'unknown',
    entityId: 'automation.visual_unknown',
    state: 'unknown',
    friendlyName: 'Visual Unknown Automation',
    search: 'Visual Unknown Automation',
  },
  {
    name: 'normal-on',
    entityId: 'automation.visual_normal_on',
    state: 'on',
    friendlyName: 'Visual Normal On Automation',
    search: 'Visual Normal On Automation',
  },
  {
    name: 'normal-off',
    entityId: 'automation.visual_normal_off',
    state: 'off',
    friendlyName: 'Visual Normal Off Automation',
    search: 'Visual Normal Off Automation',
  },
  {
    name: 'long-state',
    entityId: 'automation.visual_long_state',
    state: 'x'.repeat(180),
    friendlyName: 'Visual Long State Automation',
    search: 'Visual Long State Automation',
  },
  {
    name: 'long-friendly-name',
    entityId: 'automation.visual_long_friendly_name',
    state: 'on',
    friendlyName: LONG_TEXT,
    search: 'AutoSnooze Visual Regression Automation',
  },
  {
    name: 'missing-attributes',
    entityId: 'automation.visual_missing_attributes',
    state: 'on',
    attributes: {},
    search: 'automation.visual_missing_attributes',
  },
  {
    name: 'stale-last-updated',
    entityId: 'automation.visual_stale_last_updated',
    state: 'on',
    friendlyName: 'Visual Stale Last Updated Automation',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    search: 'Visual Stale Last Updated Automation',
  },
  {
    name: 'configured-entity-missing',
    entityId: 'automation.visual_configured_entity_missing',
    removeState: true,
    search: 'absent configured',
  },
  {
    name: 'permission-denied-like-missing-state',
    entityId: 'automation.visual_permission_denied_like_missing_state',
    removeState: true,
    search: 'absent permission',
  },
];

async function removeState(page: Page, entityId: string): Promise<void> {
  await waitForHassStateRegistry(page);
  await page.evaluate((entityId) => {
    const ha = document.querySelector('home-assistant') as HTMLElement & {
      hass?: { states?: Record<string, unknown> };
    };
    if (!ha.hass?.states) {
      throw new Error('Home Assistant state registry is not available');
    }

    const nextStates = { ...ha.hass.states };
    delete nextStates[entityId];
    ha.hass.states = nextStates;
    document.querySelectorAll('autosnooze-card').forEach((card) => {
      const autosnoozeCard = card as HTMLElement & {
        hass?: unknown;
        requestUpdate?: (name?: string) => void;
      };
      autosnoozeCard.hass = { ...ha.hass, states: nextStates };
      autosnoozeCard.requestUpdate?.('hass');
    });
  }, entityId);
}

async function filterCard(card: Locator, search: string): Promise<void> {
  const searchBox = card.locator('internal:role=searchbox').first();
  await expect(searchBox).toBeVisible();
  await searchBox.fill(search);
}

test.describe('Entity state visual matrix @visual', () => {
  for (const scenario of ENTITY_STATE_SCENARIOS) {
    test(`${scenario.name} renders without visual defects @visual`, async ({ page }) => {
      await test.step('prepare page and error monitoring', async () => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await freezeTime(page);
      });
      const monitor = installCardErrorListeners(page);

      await test.step('load existing dashboard', async () => {
        await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });
      });

      await test.step(`drive entity state: ${scenario.name}`, async () => {
        if (scenario.removeState) {
          await removeState(page, scenario.entityId);
        } else {
          await setState(
            page,
            scenario.entityId,
            scenario.state ?? 'on',
            scenario.attributes ?? { friendly_name: scenario.friendlyName ?? scenario.entityId },
            scenario.lastUpdated
              ? { lastChanged: scenario.lastUpdated, lastUpdated: scenario.lastUpdated }
              : {},
          );
        }
      });

      const card = await test.step('filter to the scenario and assert layout integrity', async () => {
        const loadedCard = await expectCardReady(page);
        await filterCard(loadedCard, scenario.search);
        await assertLayoutIntegrity(loadedCard);
        return loadedCard;
      });

      await test.step('capture state-specific card snapshot', async () => {
        await stabilizeForVisualSnapshot(page, card);
        await expect(card).toHaveScreenshot(`${scenario.name}.png`, {
          ...screenshotOptions,
          mask: volatileRegionMasks(card),
        });
      });

      await test.step('assert no card-origin errors', async () => {
        assertNoCardErrors(monitor);
      });
    });
  }
});
