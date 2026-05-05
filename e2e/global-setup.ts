import { Browser, chromium, FullConfig, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = path.join(__dirname, 'storageState.json');

async function waitForHomeAssistantHttp(page: Page, baseURL: string): Promise<void> {
  let retries = 30;
  while (retries > 0) {
    try {
      const response = await page.goto(baseURL, { timeout: 5000, waitUntil: 'domcontentloaded' });
      if (response?.ok()) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    retries -= 1;
  }

  throw new Error(`Home Assistant not available at ${baseURL}`);
}

async function hasAuthenticatedConnection(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('home-assistant', { timeout: 30000 });
    await page.waitForFunction(
      () => {
        const ha = document.querySelector('home-assistant') as HTMLElement & {
          hass?: { connection?: unknown };
        };
        return Boolean(ha?.hass?.connection);
      },
      { timeout: 30000 },
    );
    return true;
  } catch {
    return false;
  }
}

async function reuseStorageStateIfFresh(browser: Browser, baseURL: string): Promise<boolean> {
  if (!fs.existsSync(authFile)) {
    return false;
  }

  const context = await browser.newContext({ storageState: authFile });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  const authenticated = await hasAuthenticatedConnection(page);
  if (authenticated) {
    await context.storageState({ path: authFile });
  }
  await context.close();
  return authenticated;
}

async function loginAndPersistStorageState(browser: Browser, baseURL: string): Promise<void> {
  const username = process.env.HA_USERNAME || 'test';
  const password = process.env.HA_PASSWORD || '12345';
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  if (!(await hasAuthenticatedConnection(page))) {
    await page.locator('input[name="username"]').first().fill(username);
    await page.locator('input[name="password"]').first().fill(password);
    await page.getByRole('button', { name: /log in/i }).click();
  }

  if (!(await hasAuthenticatedConnection(page))) {
    throw new Error('Home Assistant login did not expose hass.connection');
  }

  await context.storageState({ path: authFile });
  await context.close();
}

async function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0].use.baseURL || process.env.HA_URL || 'http://localhost:8124');
  const browser = await chromium.launch();

  try {
    const readinessPage = await browser.newPage();
    await waitForHomeAssistantHttp(readinessPage, baseURL);
    await readinessPage.close();

    if (await reuseStorageStateIfFresh(browser, baseURL)) {
      return;
    }

    await loginAndPersistStorageState(browser, baseURL);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
