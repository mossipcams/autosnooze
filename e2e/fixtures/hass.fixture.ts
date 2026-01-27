import { test as base } from '@playwright/test';
import { AutoSnoozeCard } from '../pages/AutoSnoozeCard';
import { findCardScript } from '../helpers/shadow-dom';

interface AutoSnoozeFixtures {
  autosnoozeCard: AutoSnoozeCard;
  callService: (domain: string, service: string, data?: object) => Promise<void>;
  resetAutomations: () => Promise<void>;
  getState: (entityId: string) => Promise<string>;
}

export const test = base.extend<AutoSnoozeFixtures>({
  autosnoozeCard: async ({ page }, use) => {
    const card = new AutoSnoozeCard(page);
    await card.goto();
    await use(card);
  },

  callService: async ({ page }, use) => {
    const callService = async (domain: string, service: string, data: object = {}) => {
      await page.evaluate(
        async ({ domain, service, data }) => {
          const ha = document.querySelector('home-assistant') as HTMLElement & {
            hass?: { callService?: (d: string, s: string, sd: object) => Promise<void> };
          };
          await ha?.hass?.callService?.(domain, service, data);
        },
        { domain, service, data }
      );
      // Allow time for HA to process
      await page.waitForTimeout(200);
    };
    await use(callService);
  },

  resetAutomations: async ({ page }, use) => {
    const reset = async () => {
      // Cancel all scheduled snoozes and wake all automations
      await page.evaluate(async () => {
        const ha = document.querySelector('home-assistant') as HTMLElement & {
          hass?: { callService?: (d: string, s: string, sd: object) => Promise<void> };
        };
        try {
          await ha?.hass?.callService?.('autosnooze', 'cancel_all', {});
        } catch {
          // Ignore errors if nothing to cancel
        }
      });

      // Wait for state to settle
      await page.waitForTimeout(500);

      // Clear any autosnooze_include labels from automations (to disable whitelist mode)
      await page.evaluate(async () => {
        const ha = document.querySelector('home-assistant') as HTMLElement & {
          hass?: {
            connection?: {
              sendMessagePromise: <T>(msg: object) => Promise<T>;
            };
          };
        };
        if (!ha?.hass?.connection) return;

        try {
          // Get all entity registry entries
          const entities = await ha.hass.connection.sendMessagePromise<
            Array<{ entity_id: string; labels: string[] }>
          >({
            type: 'config/entity_registry/list',
          });

          // Find automations with autosnooze_include label and remove it
          for (const entity of entities || []) {
            if (
              entity.entity_id.startsWith('automation.') &&
              entity.labels?.includes('autosnooze_include')
            ) {
              await ha.hass.connection.sendMessagePromise({
                type: 'config/entity_registry/update',
                entity_id: entity.entity_id,
                labels: entity.labels.filter((l: string) => l !== 'autosnooze_include'),
              });
            }
          }
        } catch {
          // Ignore errors - label removal is best-effort
        }
      });

      await page.waitForTimeout(300);

      // Turn on any automations that might be off
      await page.evaluate(async () => {
        const ha = document.querySelector('home-assistant') as HTMLElement & {
          hass?: {
            states?: Record<string, { state: string }>;
            callService?: (d: string, s: string, sd: object) => Promise<void>;
          };
        };
        if (!ha?.hass?.states) return;

        for (const [entityId, state] of Object.entries(ha.hass.states)) {
          if (entityId.startsWith('automation.') && state.state === 'off') {
            try {
              await ha.hass.callService?.('automation', 'turn_on', { entity_id: entityId });
            } catch {
              // Ignore errors
            }
          }
        }
      });

      await page.waitForTimeout(300);

      // Force the card to refresh its entity registry cache (with timeout protection)
      try {
        await Promise.race([
          page.evaluate(
            `
            (async () => {
              ${findCardScript}
              const card = findAutosnoozeCard();
              if (card) {
                // Reset the entity registry cache so it re-fetches
                card._entityRegistryFetched = false;
                card._entityRegistry = {};
                card._automationsCacheVersion++;
                card._automationsCache = null;

                // Re-fetch the entity registry
                if (card.hass?.connection) {
                  try {
                    const items = await card.hass.connection.sendMessagePromise({
                      type: 'config/entity_registry/list',
                    });
                    const entityMap = {};
                    for (const item of items || []) {
                      if (item.entity_id.startsWith('automation.')) {
                        entityMap[item.entity_id] = item;
                      }
                    }
                    card._entityRegistry = entityMap;
                  } catch (e) {
                    console.error('Failed to fetch entity registry:', e);
                  }
                }
                card._entityRegistryFetched = true;
                card._automationsCacheVersion++;

                // Trigger a re-render
                if (card.requestUpdate) {
                  card.requestUpdate();
                }
              }
            })()
            `
          ),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Card refresh timeout')), 10000))
        ]);
      } catch (e) {
        // If card refresh times out, try to reload the page to recover
        console.warn('Card refresh timed out, attempting page reload');
        try {
          await page.reload({ timeout: 15000 });
          await page.waitForTimeout(2000);
        } catch {
          // Ignore reload errors - test will fail if page is truly broken
        }
      }

      // Wait for the card to re-render
      await page.waitForTimeout(500);

      // Verify Home Assistant states are loaded
      let statesLoaded = false;
      for (let i = 0; i < 10; i++) {
        statesLoaded = await page.evaluate(() => {
          const ha = document.querySelector('home-assistant') as HTMLElement & {
            hass?: { states?: Record<string, unknown> };
          };
          const states = ha?.hass?.states;
          if (!states) return false;
          // Check that at least one automation state is loaded and not 'unknown'
          for (const [entityId, stateObj] of Object.entries(states)) {
            if (entityId.startsWith('automation.') && (stateObj as { state?: string })?.state !== 'unknown') {
              return true;
            }
          }
          return false;
        });
        if (statesLoaded) break;
        await page.waitForTimeout(300);
      }
    };

    // Reset before test
    await reset();

    await use(reset);

    // Reset after test
    await reset();
  },

  getState: async ({ page }, use) => {
    const getState = async (entityId: string): Promise<string> => {
      return await page.evaluate((id) => {
        const ha = document.querySelector('home-assistant') as HTMLElement & {
          hass?: { states?: Record<string, { state: string }> };
        };
        return ha?.hass?.states?.[id]?.state ?? 'unknown';
      }, entityId);
    };
    await use(getState);
  },
});

export { expect } from '@playwright/test';
