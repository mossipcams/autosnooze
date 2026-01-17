import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:8124';

  // Ensure auth directory exists
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Wait for Home Assistant to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let retries = 30;
  while (retries > 0) {
    try {
      const response = await page.goto(baseURL, { timeout: 5000 });
      if (response?.ok()) {
        break;
      }
    } catch {
      // Connection failed, retry
    }
    retries--;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (retries === 0) {
    throw new Error(`Home Assistant not available at ${baseURL}`);
  }

  await browser.close();
}

export default globalSetup;
