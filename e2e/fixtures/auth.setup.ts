import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authDir = path.join(__dirname, '..', '.auth');
const authFile = path.join(authDir, 'user.json');

// Ensure auth directory exists
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

setup('authenticate', async ({ page }) => {
  const baseURL = process.env.HA_URL || 'http://localhost:8124';
  const username = process.env.HA_USERNAME || 'test';
  const password = process.env.HA_PASSWORD || '12345';

  // Set longer timeout for auth setup (navigation can take up to 60s)
  setup.setTimeout(90000);

  await page.goto(baseURL);

  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Check if we're on login page
  const welcomeText = page.getByText('Welcome home!');
  const isLoginPage = await welcomeText.isVisible().catch(() => false);

  if (isLoginPage) {
    // Fill username
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.waitFor({ state: 'visible' });
    await usernameInput.fill(username);

    // Fill password
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill(password);

    // Submit form by clicking the Log in button
    const loginButton = page.getByRole('button', { name: 'Log in' });
    await loginButton.waitFor({ state: 'visible', timeout: 30000 });
    await loginButton.click();

    // Wait for navigation away from login page - check URL changes
    await page.waitForFunction(
      () => !window.location.pathname.includes('/auth/authorize'),
      { timeout: 60000 }
    );

    // Wait for home-assistant element to appear (indicates successful login)
    await page.waitForSelector('home-assistant', { timeout: 30000 });

    // Wait for HA to fully initialize
    await page.waitForFunction(
      () => {
        const ha = document.querySelector('home-assistant') as any;
        return ha?.hass?.connection != null;
      },
      { timeout: 30000 }
    );

    // Additional wait for everything to settle
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  }

  // Store authentication state
  await page.context().storageState({ path: authFile });
});
