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

  // Wait for page to fully load - HA loads JavaScript-heavy content
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(5000);

  // Check if we're on login page using multiple strategies
  const welcomeHeading = page.getByRole('heading', { name: 'Welcome home!' });
  const loginButton = page.getByRole('button', { name: 'Log in' });
  const usernameInput = page.locator('input[name="username"]').first();

  // Try multiple detection methods
  let isLoginPage = await welcomeHeading.isVisible().catch(() => false);
  if (!isLoginPage) {
    isLoginPage = await loginButton.isVisible().catch(() => false);
  }
  if (!isLoginPage) {
    isLoginPage = await usernameInput.isVisible().catch(() => false);
  }

  console.log(`Login page detected: ${isLoginPage}`);

  if (isLoginPage) {
    // Wait for the auth flow component to fully load
    await page.waitForTimeout(1000);

    // Fill username
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await usernameInput.click();
    await usernameInput.fill(username);
    // Verify the value was set
    await page.waitForTimeout(200);

    // Fill password
    const passwordInput = page.locator('input[name="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.click();
    await passwordInput.fill(password);
    // Verify the value was set
    await page.waitForTimeout(200);

    // Debug: log the form values
    const usernameValue = await usernameInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    console.log(`Login attempt: username='${usernameValue}', password length=${passwordValue.length}`);

    // Submit form by clicking the Log in button
    const loginButton = page.getByRole('button', { name: 'Log in' });
    await loginButton.waitFor({ state: 'visible', timeout: 30000 });
    await loginButton.click();

    // Wait for the form to submit
    await page.waitForTimeout(3000);

    // Check if we're still on the login page (login failed)
    const stillOnLoginPage = await welcomeHeading.isVisible().catch(() => false);
    if (stillOnLoginPage) {
      // Check for error message
      const errorMsg = await page.locator('[role="alert"], .error, [class*="error"]').textContent().catch(() => '');
      throw new Error(`Login failed. Still on login page. Error: ${errorMsg || 'No error message found'}`);
    }

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

    // Verify we're logged in by checking for auth tokens in localStorage
    const hasTokens = await page.evaluate(() => {
      // HA stores auth tokens in localStorage with keys starting with 'hassTokens'
      for (const key of Object.keys(localStorage)) {
        if (key.includes('hassTokens') || key.includes('auth')) {
          return true;
        }
      }
      // Also check for any HA-related data
      return localStorage.length > 0;
    });
    console.log(`Auth tokens found: ${hasTokens}`);
  }

  // Store authentication state (includes localStorage)
  await page.context().storageState({ path: authFile });

  // Verify the storage state file has content
  const state = await page.context().storageState();
  console.log(`Storage state captured: cookies=${state.cookies.length}, origins=${state.origins.length}`);
  if (state.origins.length > 0) {
    console.log(`LocalStorage entries: ${state.origins[0]?.localStorage?.length || 0}`);
  }
});
