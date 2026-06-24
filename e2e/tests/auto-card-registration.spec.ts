import { expect, Page } from '@playwright/test';
import * as path from 'path';
import { test } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

const AUTOSNOOZE_CARD_PATH = '/autosnooze-card.js';
const DASHBOARD_PATH = 'dashboard-testing';
const AUTH_STATE_PATH = path.join(__dirname, '..', 'storageState.json');
const TEST_VIEW_PATH = 'autosnooze-registration-e2e';
const HOLD_MS = Number(process.env.AUTOSNOOZE_E2E_HOLD_MS || '0');

type ConfigEntry = {
  entry_id: string;
  domain: string;
  state?: string;
};

type LovelaceResource = {
  id: string;
  url: string;
  type?: string;
  res_type?: string;
};

type LovelaceView = {
  title?: string;
  path?: string;
  cards?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

type LovelaceConfig = {
  views?: LovelaceView[];
  [key: string]: unknown;
};

async function waitForHassConnection(page: Page): Promise<void> {
  await page.waitForSelector('home-assistant', { timeout: 30000 });
  await page.waitForFunction(
    () => {
      const ha = document.querySelector('home-assistant') as {
        hass?: { connection?: unknown };
      } | null;
      return ha?.hass?.connection !== undefined;
    },
    { timeout: 30000 }
  );
}

async function sendHassMessage<T>(page: Page, message: Record<string, unknown>): Promise<T> {
  return await page.evaluate(async (msg) => {
    const ha = document.querySelector('home-assistant') as {
      hass?: {
        connection?: {
          sendMessagePromise: <Result>(message: Record<string, unknown>) => Promise<Result>;
        };
      };
    } | null;
    if (!ha?.hass?.connection) {
      throw new Error('Home Assistant websocket connection is not available');
    }
    return await ha.hass.connection.sendMessagePromise(msg);
  }, message);
}

async function callHassApi<T>(
  page: Page,
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  return await page.evaluate(
    async ({ path, init }) => {
      function findAccessToken(value: unknown): string | null {
        if (!value || typeof value !== 'object') {
          return null;
        }
        if ('access_token' in value && typeof value.access_token === 'string') {
          return value.access_token;
        }
        for (const child of Object.values(value)) {
          const found = findAccessToken(child);
          if (found) {
            return found;
          }
        }
        return null;
      }

      let accessToken: string | null = null;
      for (const key of Object.keys(localStorage)) {
        if (!key.toLowerCase().includes('hass')) {
          continue;
        }
        try {
          accessToken = findAccessToken(JSON.parse(localStorage.getItem(key) || 'null'));
        } catch {
          continue;
        }
        if (accessToken) {
          break;
        }
      }
      if (!accessToken) {
        throw new Error('Could not find a Home Assistant access token in localStorage');
      }

      const response = await fetch(path, {
        method: init.method || 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        throw new Error(`${init.method || 'GET'} ${path} failed (${response.status}): ${text}`);
      }
      return data;
    },
    { path, init }
  );
}

async function listAutoSnoozeEntries(page: Page): Promise<ConfigEntry[]> {
  return await callHassApi<ConfigEntry[]>(page, '/api/config/config_entries/entry?domain=autosnooze');
}

async function removeAutoSnoozeEntries(page: Page): Promise<void> {
  for (const entry of await listAutoSnoozeEntries(page)) {
    await callHassApi(page, `/api/config/config_entries/entry/${entry.entry_id}`, {
      method: 'DELETE',
    });
  }
  await expect
    .poll(async () => (await listAutoSnoozeEntries(page)).length, {
      message: 'AutoSnooze config entries should be removed before the E2E setup flow',
      timeout: 15000,
    })
    .toBe(0);
}

async function reloadAutoSnoozeEntry(page: Page, entryId: string): Promise<void> {
  await callHassApi(page, `/api/config/config_entries/entry/${entryId}/reload`, {
    method: 'POST',
  });
  await expect
    .poll(
      async () =>
        (await listAutoSnoozeEntries(page)).find((entry) => entry.entry_id === entryId)?.state,
      {
        message: 'AutoSnooze config entry should be loaded after reload',
        timeout: 30000,
      }
    )
    .toBe('loaded');
}

async function addAutoSnoozeIntegration(page: Page): Promise<ConfigEntry> {
  const flow = await callHassApi<{ flow_id: string; type: string }>(
    page,
    '/api/config/config_entries/flow',
    {
      method: 'POST',
      body: { handler: 'autosnooze' },
    }
  );

  const result = await callHassApi<{ result?: ConfigEntry; type: string }>(
    page,
    `/api/config/config_entries/flow/${flow.flow_id}`,
    {
      method: 'POST',
      body: {},
    }
  );

  if (result.type !== 'create_entry' || !result.result) {
    throw new Error(`AutoSnooze config flow did not create an entry: ${JSON.stringify(result)}`);
  }

  await expect
    .poll(
      async () =>
        (await listAutoSnoozeEntries(page)).find(
          (entry) => entry.entry_id === result.result?.entry_id
        )?.state,
      {
        message: 'AutoSnooze config entry should load after setup',
        timeout: 30000,
      }
    )
    .toBe('loaded');

  return result.result;
}

async function listLovelaceResources(page: Page): Promise<LovelaceResource[]> {
  return await sendHassMessage<LovelaceResource[]>(page, { type: 'lovelace/resources' });
}

async function removeAutoSnoozeResources(page: Page): Promise<void> {
  for (const resource of await listLovelaceResources(page)) {
    if (new URL(resource.url, 'http://localhost').pathname === AUTOSNOOZE_CARD_PATH) {
      await sendHassMessage(page, {
        type: 'lovelace/resources/delete',
        resource_id: resource.id,
      });
    }
  }
  await expect
    .poll(
      async () =>
        (await listLovelaceResources(page)).filter(
          (resource) => new URL(resource.url, 'http://localhost').pathname === AUTOSNOOZE_CARD_PATH
        ).length,
      {
        message: 'AutoSnooze Lovelace resources should be removed before integration setup',
        timeout: 15000,
      }
    )
    .toBe(0);
}

async function createLovelaceResource(page: Page, url: string): Promise<LovelaceResource> {
  return await sendHassMessage<LovelaceResource>(page, {
    type: 'lovelace/resources/create',
    url,
    res_type: 'module',
  });
}

async function waitForAutoRegisteredResource(page: Page): Promise<LovelaceResource> {
  let resources: LovelaceResource[] = [];
  await expect
    .poll(
      async () => {
        resources = (await listLovelaceResources(page)).filter(
          (resource) => new URL(resource.url, 'http://localhost').pathname === AUTOSNOOZE_CARD_PATH
        );
        return resources.length;
      },
      {
        message: 'AutoSnooze should auto-register exactly one Lovelace card resource',
        timeout: 30000,
      }
    )
    .toBe(1);

  return resources[0];
}

async function readDashboardConfig(page: Page): Promise<LovelaceConfig> {
  return await sendHassMessage<LovelaceConfig>(page, {
    type: 'lovelace/config',
    url_path: DASHBOARD_PATH,
    force: true,
  });
}

async function saveDashboardConfig(page: Page, config: LovelaceConfig): Promise<void> {
  await sendHassMessage(page, {
    type: 'lovelace/config/save',
    url_path: DASHBOARD_PATH,
    config,
  });
}

function withoutAutoSnoozeTestView(config: LovelaceConfig): LovelaceConfig {
  return {
    ...config,
    views: (config.views || []).filter((view) => view.path !== TEST_VIEW_PATH),
  };
}

function withAutoSnoozeTestView(config: LovelaceConfig): LovelaceConfig {
  const views = (config.views || []).filter((view) => view.path !== TEST_VIEW_PATH);
  return {
    ...config,
    views: [
      ...views,
      {
        title: 'AutoSnooze Registration E2E',
        path: TEST_VIEW_PATH,
        cards: [
          {
            type: 'custom:autosnooze-card',
            title: 'AutoSnooze Registration E2E',
          },
        ],
      },
    ],
  };
}

function withEmptyAutoSnoozeTestView(config: LovelaceConfig): LovelaceConfig {
  const views = (config.views || []).filter((view) => view.path !== TEST_VIEW_PATH);
  return {
    ...config,
    views: [
      ...views,
      {
        title: 'AutoSnooze Registration E2E',
        path: TEST_VIEW_PATH,
        cards: [],
      },
    ],
  };
}

async function prepareCleanState(page: Page): Promise<LovelaceConfig> {
  await page.goto('/');
  await waitForHassConnection(page);

  const originalDashboardConfig = await readDashboardConfig(page);
  await saveDashboardConfig(page, withoutAutoSnoozeTestView(originalDashboardConfig));
  await removeAutoSnoozeEntries(page);
  await removeAutoSnoozeResources(page);

  return originalDashboardConfig;
}

async function restoreDashboard(page: Page, originalDashboardConfig: LovelaceConfig): Promise<void> {
  await page.goto('/');
  await waitForHassConnection(page);
  await saveDashboardConfig(page, originalDashboardConfig);
}

async function ensureAutoSnoozeIntegration(page: Page): Promise<void> {
  const existing = (await listAutoSnoozeEntries(page))[0];
  if (existing?.state === 'loaded') {
    return;
  }

  if (existing) {
    try {
      await reloadAutoSnoozeEntry(page, existing.entry_id);
      return;
    } catch {
      await removeAutoSnoozeEntries(page);
    }
  }

  await addAutoSnoozeIntegration(page);
  await waitForAutoRegisteredResource(page);
}

async function restoreAutoSnoozeBaseline(
  page: Page,
  originalDashboardConfig: LovelaceConfig
): Promise<void> {
  await restoreDashboard(page, originalDashboardConfig);
  await ensureAutoSnoozeIntegration(page);
}

async function gotoTestDashboard(page: Page): Promise<void> {
  await page.goto(`/${DASHBOARD_PATH}/${TEST_VIEW_PATH}`, { waitUntil: 'domcontentloaded' });
  await waitForHassConnection(page);
}

async function waitForAutoSnoozeCard(page: Page): Promise<void> {
  await page.waitForFunction(
    `
    (() => {
      ${findCardScript}
      const card = findAutosnoozeCard();
      return card?.shadowRoot !== null && card?.shadowRoot !== undefined;
    })()
    `,
    { timeout: 30000 }
  );
}

async function waitForNoAutoSnoozeCard(page: Page): Promise<void> {
  await page.waitForFunction(
    `
    (() => {
      ${findCardScript}
      return findAutosnoozeCard() === null;
    })()
    `,
    { timeout: 30000 }
  );
}

async function inspectRenderedDashboard(page: Page) {
  return await page.evaluate(`
    (() => {
      ${findCardScript}

      const expectedTags = [
        'autosnooze-card-editor',
        'autosnooze-active-pauses',
        'autosnooze-duration-selector',
        'autosnooze-automation-list',
        'autosnooze-adjust-modal',
        'autosnooze-card',
      ];
      const card = findAutosnoozeCard();
      const cardConstructor = customElements.get('autosnooze-card');
      const metadataEntries = (window.customCards || []).filter(
        (entry) => entry?.type === 'autosnooze-card'
      );
      const loadedCardResources = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((name) => {
          try {
            return new URL(name, window.location.href).pathname === '${AUTOSNOOZE_CARD_PATH}';
          } catch {
            return false;
          }
        });

      function queryAllDeep(root, selector) {
        const results = [];
        if (root.querySelectorAll) {
          results.push(...root.querySelectorAll(selector));
        }
        if (root.shadowRoot) {
          results.push(...queryAllDeep(root.shadowRoot, selector));
        }
        const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
        for (const element of elements) {
          if (element.shadowRoot) {
            results.push(...queryAllDeep(element.shadowRoot, selector));
          }
        }
        return results;
      }

      function collectTextDeep(root) {
        let text = root.textContent || '';
        if (root.shadowRoot) {
          text += '\\n' + collectTextDeep(root.shadowRoot);
        }
        const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
        for (const element of elements) {
          if (element.shadowRoot) {
            text += '\\n' + collectTextDeep(element.shadowRoot);
          }
        }
        return text;
      }

      const errorCards = queryAllDeep(document, 'hui-error-card, ha-alert[alert-type="error"]')
        .map((errorCard) => errorCard.textContent?.trim() || errorCard.tagName.toLowerCase());
      const cardText = card ? collectTextDeep(card) : '';
      const durationLabels = card
        ? deepQueryAll(card, '.pill').map((pill) => pill.textContent?.trim() || '')
        : [];

      return {
        registeredTags: expectedTags.map((tag) => ({
          tag,
          registered: customElements.get(tag) !== undefined,
        })),
        cardTagName: card?.tagName.toLowerCase() ?? null,
        cardHasShadowRoot: card?.shadowRoot !== null,
        cardUsesRegisteredConstructor: Boolean(
          card && cardConstructor && card.constructor === cardConstructor
        ),
        metadataEntries,
        loadedCardResources,
        errorCards,
        bodyText: collectTextDeep(document.body),
        cardText,
        durationLabels,
        hasDurationSelector: card ? deepQuery(card, 'autosnooze-duration-selector') !== null : false,
        hasAutomationList: card ? deepQuery(card, 'autosnooze-automation-list') !== null : false,
      };
    })()
  `);
}

async function inspectCardAbsence(page: Page) {
  return await page.evaluate(`
    (() => {
      ${findCardScript}

      function queryAllDeep(root, selector) {
        const results = [];
        if (root.querySelectorAll) {
          results.push(...root.querySelectorAll(selector));
        }
        if (root.shadowRoot) {
          results.push(...queryAllDeep(root.shadowRoot, selector));
        }
        const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
        for (const element of elements) {
          if (element.shadowRoot) {
            results.push(...queryAllDeep(element.shadowRoot, selector));
          }
        }
        return results;
      }

      function collectTextDeep(root) {
        let text = root.textContent || '';
        if (root.shadowRoot) {
          text += '\\n' + collectTextDeep(root.shadowRoot);
        }
        const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
        for (const element of elements) {
          if (element.shadowRoot) {
            text += '\\n' + collectTextDeep(element.shadowRoot);
          }
        }
        return text;
      }

      return {
        hasCard: findAutosnoozeCard() !== null,
        errorCards: queryAllDeep(document, 'hui-error-card, ha-alert[alert-type="error"]')
          .map((errorCard) => errorCard.textContent?.trim() || errorCard.tagName.toLowerCase()),
        bodyText: collectTextDeep(document.body),
      };
    })()
  `);
}

function expectAutoSnoozeResource(resource: LovelaceResource): void {
  expect(resource.type ?? resource.res_type).toBe('module');
  expect(resource.url).toContain(AUTOSNOOZE_CARD_PATH);
  expect(resource.url).toContain('?v=');
}

function expectRenderedCardIsHealthy(registration: Awaited<ReturnType<typeof inspectRenderedDashboard>>): void {
  expect(registration.registeredTags).toEqual([
    { tag: 'autosnooze-card-editor', registered: true },
    { tag: 'autosnooze-active-pauses', registered: true },
    { tag: 'autosnooze-duration-selector', registered: true },
    { tag: 'autosnooze-automation-list', registered: true },
    { tag: 'autosnooze-adjust-modal', registered: true },
    { tag: 'autosnooze-card', registered: true },
  ]);
  expect(registration.cardTagName).toBe('autosnooze-card');
  expect(registration.cardHasShadowRoot).toBe(true);
  expect(registration.cardUsesRegisteredConstructor).toBe(true);
  expect(registration.metadataEntries).toHaveLength(1);
  expect(registration.metadataEntries[0]).toMatchObject({
    type: 'autosnooze-card',
    name: 'AutoSnooze Card',
    preview: true,
    documentationURL: 'https://github.com/mossipcams/autosnooze#readme',
  });
  expect(registration.loadedCardResources).toHaveLength(1);
  expect(registration.loadedCardResources[0]).toContain(AUTOSNOOZE_CARD_PATH);
  expect(registration.errorCards).toEqual([]);
  expect(registration.bodyText).not.toContain("Custom element doesn't exist");
  expect(registration.cardText.toLowerCase()).toContain('autosnooze');
  expect(registration.durationLabels).toEqual(
    expect.arrayContaining(['30m', '1h', '1d', 'Custom'])
  );
  expect(registration.hasDurationSelector).toBe(true);
  expect(registration.hasAutomationList).toBe(true);
}

function expectCardIsAbsent(absence: Awaited<ReturnType<typeof inspectCardAbsence>>): void {
  expect(absence.hasCard).toBe(false);
  expect(absence.errorCards).toEqual([]);
  expect(absence.bodyText).not.toContain("Custom element doesn't exist");
}

async function holdForVisualInspection(page: Page): Promise<void> {
  if (HOLD_MS > 0) {
    await page.waitForTimeout(HOLD_MS);
  }
}

test.describe('Auto card registration', () => {
  test('happy path: adds the integration, auto-registers the card, and renders visible card UI', async ({
    page,
  }) => {
    const originalDashboardConfig = await prepareCleanState(page);

    try {
      const entry = await addAutoSnoozeIntegration(page);
      expect(entry.domain).toBe('autosnooze');

      const resource = await waitForAutoRegisteredResource(page);
      expectAutoSnoozeResource(resource);

      await saveDashboardConfig(page, withAutoSnoozeTestView(originalDashboardConfig));
      await gotoTestDashboard(page);
      await waitForAutoSnoozeCard(page);

      expectRenderedCardIsHealthy(await inspectRenderedDashboard(page));
      await holdForVisualInspection(page);
    } finally {
      await restoreAutoSnoozeBaseline(page, originalDashboardConfig);
    }
  });

  test('edge case: card can be removed from the dashboard and re-added without errors', async ({
    page,
  }) => {
    const originalDashboardConfig = await prepareCleanState(page);

    try {
      await addAutoSnoozeIntegration(page);
      expectAutoSnoozeResource(await waitForAutoRegisteredResource(page));

      await saveDashboardConfig(page, withAutoSnoozeTestView(originalDashboardConfig));
      await gotoTestDashboard(page);
      await waitForAutoSnoozeCard(page);
      expectRenderedCardIsHealthy(await inspectRenderedDashboard(page));

      await saveDashboardConfig(page, withEmptyAutoSnoozeTestView(originalDashboardConfig));
      await gotoTestDashboard(page);
      await waitForNoAutoSnoozeCard(page);
      expectCardIsAbsent(await inspectCardAbsence(page));

      await saveDashboardConfig(page, withAutoSnoozeTestView(originalDashboardConfig));
      await gotoTestDashboard(page);
      await waitForAutoSnoozeCard(page);
      expectRenderedCardIsHealthy(await inspectRenderedDashboard(page));
      await holdForVisualInspection(page);
    } finally {
      await restoreAutoSnoozeBaseline(page, originalDashboardConfig);
    }
  });

  test('edge case: setup updates a stale card resource version and the card still renders', async ({
    page,
  }) => {
    const originalDashboardConfig = await prepareCleanState(page);

    try {
      const staleResource = await createLovelaceResource(
        page,
        `${AUTOSNOOZE_CARD_PATH}?v=stale-e2e`
      );
      expect(staleResource.url).toBe(`${AUTOSNOOZE_CARD_PATH}?v=stale-e2e`);

      await addAutoSnoozeIntegration(page);

      const resource = await waitForAutoRegisteredResource(page);
      expectAutoSnoozeResource(resource);
      expect(resource.url).not.toBe(`${AUTOSNOOZE_CARD_PATH}?v=stale-e2e`);
      expect((await listLovelaceResources(page)).filter(
        (candidate) => new URL(candidate.url, 'http://localhost').pathname === AUTOSNOOZE_CARD_PATH
      )).toHaveLength(1);

      await saveDashboardConfig(page, withAutoSnoozeTestView(originalDashboardConfig));
      await gotoTestDashboard(page);
      await waitForAutoSnoozeCard(page);
      expectRenderedCardIsHealthy(await inspectRenderedDashboard(page));
      await holdForVisualInspection(page);
    } finally {
      await restoreAutoSnoozeBaseline(page, originalDashboardConfig);
    }
  });

  test('edge case: setup corrects an existing card resource with the wrong JavaScript type', async ({
    page,
  }) => {
    const originalDashboardConfig = await prepareCleanState(page);

    try {
      await addAutoSnoozeIntegration(page);
      const currentResource = await waitForAutoRegisteredResource(page);
      expectAutoSnoozeResource(currentResource);

      await removeAutoSnoozeEntries(page);
      await removeAutoSnoozeResources(page);

      const wrongTypeResource = await createLovelaceResource(page, currentResource.url);
      expect(wrongTypeResource.url).toBe(currentResource.url);
      await sendHassMessage(page, {
        type: 'lovelace/resources/update',
        resource_id: wrongTypeResource.id,
        res_type: 'js',
      });

      await addAutoSnoozeIntegration(page);

      const correctedResource = await waitForAutoRegisteredResource(page);
      expect(correctedResource.id).toBe(wrongTypeResource.id);
      expectAutoSnoozeResource(correctedResource);

      await saveDashboardConfig(page, withAutoSnoozeTestView(originalDashboardConfig));
      await gotoTestDashboard(page);
      await waitForAutoSnoozeCard(page);
      expectRenderedCardIsHealthy(await inspectRenderedDashboard(page));
      await holdForVisualInspection(page);
    } finally {
      await restoreAutoSnoozeBaseline(page, originalDashboardConfig);
    }
  });

  test('edge case: reloading the integration keeps card registration idempotent', async ({
    page,
  }) => {
    const originalDashboardConfig = await prepareCleanState(page);

    try {
      const entry = await addAutoSnoozeIntegration(page);
      const firstResource = await waitForAutoRegisteredResource(page);
      expectAutoSnoozeResource(firstResource);

      await reloadAutoSnoozeEntry(page, entry.entry_id);

      const resources = (await listLovelaceResources(page)).filter(
        (resource) => new URL(resource.url, 'http://localhost').pathname === AUTOSNOOZE_CARD_PATH
      );
      expect(resources).toHaveLength(1);
      expectAutoSnoozeResource(resources[0]);

      await saveDashboardConfig(page, withAutoSnoozeTestView(originalDashboardConfig));
      await gotoTestDashboard(page);
      await waitForAutoSnoozeCard(page);
      expectRenderedCardIsHealthy(await inspectRenderedDashboard(page));
      await holdForVisualInspection(page);
    } finally {
      await restoreAutoSnoozeBaseline(page, originalDashboardConfig);
    }
  });

  test('sad path: dashboard card shows a Lovelace error when the integration did not register the resource', async ({
    browser,
    page,
  }) => {
    const originalDashboardConfig = await prepareCleanState(page);

    try {
      await saveDashboardConfig(page, withAutoSnoozeTestView(originalDashboardConfig));

      const freshContext = await browser.newContext({ storageState: AUTH_STATE_PATH });
      const freshPage = await freshContext.newPage();
      try {
        await gotoTestDashboard(freshPage);
        await expect
          .poll(
            async () =>
              await freshPage.evaluate(`
                (() => {
                  function queryAllDeep(root, selector) {
                    const results = [];
                    if (root.querySelectorAll) {
                      results.push(...root.querySelectorAll(selector));
                    }
                    const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
                    for (const element of elements) {
                      if (element.shadowRoot) {
                        results.push(...queryAllDeep(element.shadowRoot, selector));
                      }
                    }
                    return results;
                  }

                  function collectTextDeep(root) {
                    let text = root.textContent || '';
                    const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
                    for (const element of elements) {
                      if (element.shadowRoot) {
                        text += '\\n' + collectTextDeep(element.shadowRoot);
                      }
                    }
                    return text;
                  }

                  const errorCards = queryAllDeep(document, 'hui-error-card, ha-alert[alert-type="error"]');
                  const pageText = collectTextDeep(document.body);
                  return {
                    errorCount: errorCards.length,
                    hasCustomElementError: pageText.includes("Custom element doesn't exist"),
                    hasRegisteredCard: customElements.get('autosnooze-card') !== undefined,
                    pageText,
                  };
                })()
              `),
            {
              message: 'Lovelace should report that custom:autosnooze-card is unavailable without the registered resource',
              timeout: 30000,
            }
          )
          .toMatchObject({
            hasCustomElementError: true,
            hasRegisteredCard: false,
          });
        await holdForVisualInspection(freshPage);
      } finally {
        await freshContext.close();
      }
    } finally {
      await restoreAutoSnoozeBaseline(page, originalDashboardConfig);
    }
  });
});
