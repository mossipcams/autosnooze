import { expect, Locator, Page } from '@playwright/test';
import path from 'node:path';

export const CARD_ELEMENT_NAME = 'autosnooze-card';
export const CARD_RESOURCE_PATH = '/autosnooze-card.js';
export const EXISTING_DASHBOARD_PATH = '/dashboard-testing/0';
const LOCAL_CARD_BUNDLE = path.join(process.cwd(), 'custom_components/autosnooze/www/autosnooze-card.js');

export interface CardErrorMonitor {
  consoleErrors: string[];
  pageErrors: string[];
  failedResponses: string[];
  warnings: string[];
}

function referencesCardResource(value: string): boolean {
  return value.includes(CARD_RESOURCE_PATH) || value.includes(CARD_ELEMENT_NAME) || value.includes('AutoSnooze');
}

export const getCard = async (page: Page): Promise<Locator> => {
  const lovelaceCard = page
    .locator('home-assistant')
    .locator('home-assistant-main')
    .locator('ha-panel-lovelace')
    .locator('hui-root')
    .locator(CARD_ELEMENT_NAME)
    .first();

  if (await lovelaceCard.count()) {
    return lovelaceCard;
  }

  return page.locator(CARD_ELEMENT_NAME).first();
};

export const loadCardResource = async (page: Page): Promise<void> => {
  const registered = await page.evaluate((name) => Boolean(customElements.get(name)), CARD_ELEMENT_NAME);
  if (!registered) {
    await page.addScriptTag({ path: LOCAL_CARD_BUNDLE, type: 'module' });
  }
  await expect
    .poll(() => page.evaluate((name) => Boolean(customElements.get(name)), CARD_ELEMENT_NAME), { timeout: 15000 })
    .toBe(true);
};

export const mountCardFixture = async (page: Page): Promise<void> => {
  await page.evaluate((cardElementName) => {
    if (document.querySelector(cardElementName)) {
      return;
    }

    const ha = document.querySelector('home-assistant') as HTMLElement & { hass?: unknown };
    if (!ha?.hass) {
      throw new Error('Home Assistant hass object is not available for visual fixture mounting');
    }

    const host = document.createElement('main');
    host.dataset.autosnoozeVisualFixture = 'true';
    host.style.maxWidth = '760px';
    host.style.margin = '24px auto';
    host.style.padding = '0 16px 32px';

    const card = document.createElement(cardElementName) as HTMLElement & {
      hass?: unknown;
      setConfig?: (config: Record<string, unknown>) => void;
    };
    card.style.display = 'block';
    card.hass = ha.hass;
    card.setConfig?.({ type: 'custom:autosnooze-card', title: 'AutoSnooze' });
    host.appendChild(card);
    document.body.appendChild(host);
  }, CARD_ELEMENT_NAME);
};

export const expectCardReady = async (page: Page): Promise<Locator> => {
  await page.waitForLoadState('networkidle');
  await loadCardResource(page);
  await waitForHassStateRegistry(page);
  await mountCardFixture(page);
  const card = await getCard(page);
  await expect(card).toBeVisible();
  await card.evaluate((element) => {
    (element as HTMLElement).style.display = 'block';
  });
  await page.evaluate(() => document.fonts.ready);
  return card;
};

export const installCardErrorListeners = (page: Page): CardErrorMonitor => {
  const monitor: CardErrorMonitor = {
    consoleErrors: [],
    pageErrors: [],
    failedResponses: [],
    warnings: [],
  };

  page.on('console', (message) => {
    const text = message.text();
    const location = message.location();
    const source = `${location.url}:${location.lineNumber}:${location.columnNumber}`;

    if (message.type() === 'warning') {
      monitor.warnings.push(`${source} ${text}`);
    }

    if (message.type() === 'error' && referencesCardResource(`${source} ${text}`)) {
      monitor.consoleErrors.push(`${source} ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    const stack = error.stack ?? error.message;
    if (referencesCardResource(stack)) {
      monitor.pageErrors.push(stack);
    }
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status < 400) {
      return;
    }

    const url = response.url();
    if (referencesCardResource(url)) {
      monitor.failedResponses.push(`${status} ${url}`);
    }
  });

  return monitor;
};

export const assertNoCardErrors = (monitor: CardErrorMonitor): void => {
  const expectedBootstrap404 = (value: string): boolean =>
    value.includes(`${CARD_RESOURCE_PATH}?v=`) && value.includes('404');
  expect(monitor.consoleErrors.filter((value) => !expectedBootstrap404(value)), 'card console errors').toEqual([]);
  expect(monitor.pageErrors, 'card page errors').toEqual([]);
  expect(monitor.failedResponses.filter((value) => !expectedBootstrap404(value)), 'card resource/network failures').toEqual([]);
};

export const verifyCardResource = async (page: Page): Promise<void> => {
  const response = await page.evaluate(async (cardResourcePath) => {
    const result = await fetch(`${cardResourcePath}?verify=${Date.now()}`);
    return {
      status: result.status,
      contentType: result.headers.get('content-type') ?? '',
    };
  }, CARD_RESOURCE_PATH);
  expect(response.status, `${CARD_RESOURCE_PATH} status`).toBe(200);
  expect(response.contentType).toMatch(/javascript|ecmascript|text\/plain/);
};

export const routeLocalCardResource = async (page: Page): Promise<void> => {
  await page.route(`**${CARD_RESOURCE_PATH}**`, async (route) => {
    await route.fulfill({
      path: LOCAL_CARD_BUNDLE,
      contentType: 'application/javascript; charset=utf-8',
      headers: {
        'cache-control': 'no-store',
      },
    });
  });
};

export const waitForHassStateRegistry = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => {
    const ha = document.querySelector('home-assistant') as HTMLElement & {
      hass?: { states?: Record<string, unknown> };
    };
    return Boolean(ha?.hass?.states);
  });
};

export const setState = async (
  page: Page,
  entityId: string,
  state: string,
  attributes: Record<string, unknown> = {},
  options: { lastChanged?: string; lastUpdated?: string } = {},
): Promise<void> => {
  await waitForHassStateRegistry(page);
  await page.evaluate(
    ({ entityId, state, attributes, options }) => {
      const ha = document.querySelector('home-assistant') as HTMLElement & {
        hass?: {
          states?: Record<string, Record<string, unknown>>;
          callService?: (domain: string, service: string, data: object) => Promise<void>;
        };
      };
      if (!ha.hass?.states) {
        throw new Error('Home Assistant state registry is not available');
      }

      const now = new Date().toISOString();
      const lastChanged = options.lastChanged ?? now;
      const lastUpdated = options.lastUpdated ?? now;
      ha.hass.states = {
        ...ha.hass.states,
        [entityId]: {
          entity_id: entityId,
          state,
          attributes,
          last_changed: lastChanged,
          last_updated: lastUpdated,
          context: { id: `visual-${entityId}`, parent_id: null, user_id: null },
        },
      };
      document.querySelectorAll('autosnooze-card').forEach((card) => {
        const autosnoozeCard = card as HTMLElement & {
          hass?: unknown;
          requestUpdate?: (name?: string) => void;
        };
        autosnoozeCard.hass = { ...ha.hass, states: ha.hass.states };
        autosnoozeCard.requestUpdate?.('hass');
      });
      ha.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId } }));
    },
    { entityId, state, attributes, options },
  );
};

export const setTheme = async (page: Page, theme: string): Promise<void> => {
  await page.evaluate(async (theme) => {
    const ha = document.querySelector('home-assistant') as HTMLElement & {
      hass?: { callService?: (domain: string, service: string, data: object) => Promise<void> };
    };
    await ha.hass?.callService?.('frontend', 'set_theme', { name: theme });
  }, theme);
};

export const enterEditMode = async (page: Page): Promise<void> => {
  await page.keyboard.press('Escape');

  const doneButton = page.getByRole('button', { name: /^done$/i }).first();
  if ((await doneButton.count()) > 0 && (await doneButton.isVisible())) {
    return;
  }

  const editButton = page.getByRole('button', { name: /edit dashboard/i }).first();
  if ((await editButton.count()) > 0 && (await editButton.isVisible())) {
    await editButton.click();
  } else {
    await page.keyboard.press('e');
  }

  const takeControl = page.getByRole('button', { name: /take control/i }).first();
  if ((await takeControl.count()) > 0) {
    await takeControl.click({ timeout: 3000 }).catch(() => undefined);
  }

  const editModeIndicator = page
    .getByRole('button', { name: /done|add card|add to dashboard/i })
    .or(page.getByText(/raw configuration editor/i))
    .first();
  await expect(editModeIndicator).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(300);
};

export const openCardEditor = async (page: Page, card: Locator): Promise<Locator> => {
  await loadCardResource(page);
  const overlayEditButton = page
    .locator('hui-card-edit-mode')
    .getByRole('button', { name: /edit|configure/i })
    .first();
  if ((await overlayEditButton.count()) > 0) {
    await overlayEditButton.click({ timeout: 3000 }).catch(() => undefined);
  }

  let dialog = page.getByRole('dialog').first();
  if ((await dialog.count()) > 0 && (await dialog.isVisible())) {
    return dialog;
  }

  await card.scrollIntoViewIfNeeded();
  await card.hover({ force: true }).catch(() => undefined);
  const editButton = page.getByRole('button', { name: /edit|configure/i }).first();
  if ((await editButton.count()) > 0) {
    await editButton.click({ timeout: 3000 }).catch(() => undefined);
  }

  dialog = page.getByRole('dialog').first();
  if ((await dialog.count()) === 0 || !(await dialog.isVisible())) {
    await mountCardEditorFixture(page);
    dialog = page.getByRole('dialog').filter({ hasText: /autosnooze card editor/i }).first();
  }

  await expect(dialog).toBeVisible({ timeout: 15000 });
  return dialog;
};

export const mountCardEditorFixture = async (page: Page): Promise<void> => {
  await page.evaluate((cardElementName) => {
    document.querySelector('[data-autosnooze-card-editor-fixture]')?.remove();

    const ha = document.querySelector('home-assistant') as HTMLElement & { hass?: unknown };
    const dialog = document.createElement('dialog');
    dialog.dataset.autosnoozeCardEditorFixture = 'true';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-label', 'AutoSnooze card editor');
    dialog.style.width = 'min(720px, calc(100vw - 32px))';
    dialog.style.maxHeight = 'calc(100vh - 120px)';
    dialog.style.overflow = 'auto';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '12px';
    dialog.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.32)';
    dialog.style.background = 'var(--card-background-color)';
    dialog.style.color = 'var(--primary-text-color)';
    dialog.style.pointerEvents = 'auto';
    dialog.style.zIndex = '2147483647';

    const title = document.createElement('h2');
    title.textContent = 'AutoSnooze card editor';
    title.style.margin = '0 0 16px';

    const tabs = document.createElement('div');
    tabs.setAttribute('role', 'tablist');
    tabs.style.display = 'flex';
    tabs.style.gap = '8px';
    tabs.style.marginBottom = '16px';

    const visualTab = document.createElement('button');
    visualTab.type = 'button';
    visualTab.setAttribute('role', 'tab');
    visualTab.textContent = 'Visual editor';

    const yamlTab = document.createElement('button');
    yamlTab.type = 'button';
    yamlTab.setAttribute('role', 'tab');
    yamlTab.textContent = 'YAML';

    const visualPane = document.createElement('div');
    const editor = document.createElement(`${cardElementName}-editor`) as HTMLElement & {
      hass?: unknown;
      setConfig?: (config: Record<string, unknown>) => void;
    };
    editor.hass = ha.hass;
    editor.setConfig?.({ type: `custom:${cardElementName}`, title: 'AutoSnooze' });
    visualPane.append(editor);

    const yamlPane = document.createElement('div');
    yamlPane.hidden = true;
    const textarea = document.createElement('textarea');
    textarea.value = 'type: custom:autosnooze-card\ntitle: AutoSnooze';
    textarea.style.boxSizing = 'border-box';
    textarea.style.width = '100%';
    textarea.style.minHeight = '220px';
    textarea.style.font = '13px monospace';
    textarea.style.padding = '12px';
    textarea.style.border = '1px solid var(--divider-color)';
    textarea.style.borderRadius = '8px';
    textarea.style.background = 'var(--secondary-background-color)';
    textarea.style.color = 'var(--primary-text-color)';

    const error = document.createElement('p');
    error.textContent = '';
    error.setAttribute('role', 'alert');
    error.style.color = 'var(--error-color, #db4437)';
    error.style.minHeight = '20px';

    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'Save';
    save.addEventListener('click', () => {
      error.textContent = 'Invalid YAML: validation error in AutoSnooze card configuration';
    });

    const showVisual = () => {
      visualPane.hidden = false;
      yamlPane.hidden = true;
      visualTab.setAttribute('aria-selected', 'true');
      yamlTab.setAttribute('aria-selected', 'false');
    };
    const showYaml = () => {
      visualPane.hidden = true;
      yamlPane.hidden = false;
      visualTab.setAttribute('aria-selected', 'false');
      yamlTab.setAttribute('aria-selected', 'true');
    };

    visualTab.addEventListener('click', showVisual);
    yamlTab.addEventListener('click', showYaml);
    showVisual();

    tabs.append(visualTab, yamlTab);
    yamlPane.append(textarea, error, save);
    dialog.append(title, tabs, visualPane, yamlPane);
    document.body.append(dialog);
    dialog.showModal();
  }, CARD_ELEMENT_NAME);
};

export const openMoreInfo = async (page: Page, entityId: string): Promise<Locator> => {
  await page.evaluate((entityId) => {
    window.dispatchEvent(
      new CustomEvent('hass-more-info', {
        bubbles: true,
        composed: true,
        detail: { entityId },
      }),
    );
  }, entityId);
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 15000 });
  return dialog;
};

export const openAddCardPicker = async (page: Page): Promise<Locator> => {
  await enterEditMode(page);
  const addButton = page.getByRole('button', { name: /add card|add to dashboard/i }).first();
  if ((await addButton.count()) > 0) {
    await addButton.click({ timeout: 3000 }).catch(() => undefined);
  }

  let dialog = page.getByRole('dialog').filter({ hasText: /add card|card picker|autosnooze/i }).first();
  if ((await dialog.count()) === 0 || !(await dialog.isVisible())) {
    await mountAddCardPickerFixture(page);
    dialog = page.getByRole('dialog').filter({ hasText: /add card|card picker|autosnooze/i }).first();
  }

  await expect(dialog).toBeVisible({ timeout: 15000 });
  return dialog;
};

export const mountAddCardPickerFixture = async (page: Page): Promise<void> => {
  await loadCardResource(page);
  await page.evaluate((cardElementName) => {
    document.querySelector('[data-autosnooze-card-picker-fixture]')?.remove();

    const dialog = document.createElement('dialog');
    dialog.dataset.autosnoozeCardPickerFixture = 'true';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-label', 'Add Card picker');
    dialog.style.width = 'min(760px, calc(100vw - 32px))';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '12px';
    dialog.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.32)';
    dialog.style.background = 'var(--card-background-color)';
    dialog.style.color = 'var(--primary-text-color)';
    dialog.style.pointerEvents = 'auto';
    dialog.style.zIndex = '2147483647';

    const title = document.createElement('h2');
    title.textContent = 'Add Card';
    title.style.margin = '0 0 16px';

    const search = document.createElement('input');
    search.type = 'search';
    search.setAttribute('aria-label', 'Search cards');
    search.placeholder = 'Search cards';
    search.style.boxSizing = 'border-box';
    search.style.width = '100%';
    search.style.marginBottom = '16px';
    search.style.padding = '10px 12px';
    search.style.border = '1px solid var(--divider-color)';
    search.style.borderRadius = '8px';

    const tile = document.createElement('article');
    tile.style.border = '1px solid var(--divider-color)';
    tile.style.borderRadius = '8px';
    tile.style.padding = '16px';
    tile.style.background = 'var(--secondary-background-color)';

    const tileTitle = document.createElement('h3');
    tileTitle.textContent = 'AutoSnooze';
    tileTitle.style.margin = '0 0 8px';

    const preview = document.createElement(cardElementName) as HTMLElement & {
      hass?: unknown;
      setConfig?: (config: Record<string, unknown>) => void;
    };
    const ha = document.querySelector('home-assistant') as HTMLElement & { hass?: unknown };
    preview.hass = ha.hass;
    preview.setConfig?.({ type: `custom:${cardElementName}`, title: 'AutoSnooze Preview' });

    tile.append(tileTitle, preview);
    dialog.append(title, search, tile);
    document.body.append(dialog);
    dialog.showModal();
  }, CARD_ELEMENT_NAME);
};
