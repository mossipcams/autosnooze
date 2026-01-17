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
  const password = process.env.HA_PASSWORD || 'test';

  await page.goto(baseURL);

  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Check if we're on login page
  const welcomeText = page.getByText('Welcome home!');
  const isLoginPage = await welcomeText.isVisible().catch(() => false);

  if (isLoginPage) {
    // Fill username using the input directly
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.fill(username);

    // Fill password
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill(password);

    // Submit form by pressing Enter on password field
    await passwordInput.press('Enter');

    // Wait for redirect to dashboard (could be lovelace or any dashboard)
    await page.waitForURL('**/*lovelace*/**', { timeout: 60000 }).catch(async () => {
      // Might redirect to default dashboard instead
      await page.waitForLoadState('networkidle');
    });
  }

  // Wait for dashboard to be ready
  await page.waitForLoadState('networkidle');

  // Store authentication state
  await page.context().storageState({ path: authFile });
});
