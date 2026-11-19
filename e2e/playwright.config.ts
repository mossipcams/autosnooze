import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, 'storageState.json');
const useHeadedSnapshots = process.env.PLAYWRIGHT_HEADED_SNAPSHOTS === '1';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['list'],
    process.env.CI ? ['github'] : ['line'],
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: process.env.HA_URL || 'http://localhost:8124',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    // HA's service worker reloads the page on controllerchange a few seconds after first load.
    serviceWorkers: 'block',
  },
  globalSetup: './global-setup.ts',
  projects: [
    {
      name: useHeadedSnapshots ? 'chromium-headed' : 'chromium',
      testDir: './tests',
      use: {
        ...devices['Desktop Chrome'],
        headless: !useHeadedSnapshots,
        storageState: authFile,
      },
    },
  ],
});
