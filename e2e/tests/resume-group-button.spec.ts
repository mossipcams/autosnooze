/**
 * Resume group sits in the slim group bar: it stays compact, doesn't change size when it
 * turns into Confirm, and Confirm keeps its warning fill while the pointer is still on it.
 */
import { Page } from '@playwright/test';
import { authenticatedVisualTest as test, expect } from '../helpers/fixtures';
import { EXISTING_DASHBOARD_PATH, expectCardReady } from '../helpers/ha';

async function callService(page: Page, service: string, data: object) {
  await page.evaluate(async ([s, d]) => {
    const ha = document.querySelector('home-assistant') as unknown as {
      hass: { callService: (a: string, b: string, c: object) => Promise<unknown> };
    };
    await ha.hass.callService('autosnooze', s as string, d as object);
  }, [service, data] as const);
}

for (const vp of [
  { name: 'desktop', width: 1280, min: 36, max: 36 },
  { name: 'mobile', width: 411, min: 44, max: 44 },
] as const) {
  test(`Resume group button stays compact and steady (${vp.name})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: 1600 });
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });
    const card = await expectCardReady(page);
    const ids = await page.evaluate(() => {
      const ha = document.querySelector('home-assistant') as unknown as { hass: { states: Record<string, unknown> } };
      return Object.keys(ha.hass.states).filter((id) => id.startsWith('automation.')).slice(0, 3);
    });
    expect(ids).toHaveLength(3);
    try {
      await callService(page, 'pause', { entity_id: ids.slice(0, 2), hours: 1 });
      await callService(page, 'pause', { entity_id: ids[2], hours: 2 });
      const btn = card.locator('autosnooze-active-pauses .wake-group-btn');
      await expect(btn).toBeVisible({ timeout: 15000 });

      const before = await btn.boundingBox();
      expect(before!.height).toBeGreaterThanOrEqual(vp.min);
      expect(before!.height).toBeLessThanOrEqual(vp.max);

      await btn.click();
      await expect(btn).toHaveClass(/pending/);
      await btn.hover();
      const after = await btn.boundingBox();
      expect(after!.width).toBeCloseTo(before!.width, 0);
      expect(after!.height).toBeCloseTo(before!.height, 0);

      const warning = await btn.evaluate((el) => {
        const probe = document.createElement('div');
        probe.style.color = 'var(--warning-color, #ff9800)';
        el.parentElement!.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      // Polls past the button's colour transition.
      await expect.poll(() => btn.evaluate((el) => getComputedStyle(el).backgroundColor),
        { message: 'Confirm keeps the warning fill while hovered' }).toBe(warning);
    } finally {
      await callService(page, 'cancel', { entity_id: ids });
    }
  });
}
