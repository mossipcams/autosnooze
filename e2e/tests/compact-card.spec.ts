/**
 * The idle card stays compact without shrinking tap targets below comfortable sizes:
 * 44px on phones, 36px with a mouse.
 */
import { authenticatedVisualTest as test, expect } from '../helpers/fixtures';
import { EXISTING_DASHBOARD_PATH, expectCardReady } from '../helpers/ha';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 1600, maxCardHeight: 480, minTarget: 36 },
  { name: 'mobile', width: 411, height: 1600, maxCardHeight: 520, minTarget: 44 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`idle card is compact with comfortable tap targets (${viewport.name})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });
    const card = await expectCardReady(page);

    const box = await card.boundingBox();
    expect(box?.height).toBeLessThanOrEqual(viewport.maxCardHeight);

    const pills = card.getByRole('radiogroup', { name: 'Snooze until' });
    await expect(pills).toBeVisible();

    const heights = await card.evaluate((el) => {
      const sr = el.shadowRoot!;
      const list = sr.querySelector('autosnooze-automation-list')!.shadowRoot!;
      const dur = sr.querySelector('autosnooze-duration-selector')!.shadowRoot!;
      const h = (e: Element | null) => (e ? e.getBoundingClientRect().height : 0);
      return {
        row: h(list.querySelector('.list-item')),
        pill: h(dur.querySelector('.pill')),
        notify: h(sr.querySelector('.notify-toggle')),
        snooze: h(sr.querySelector('.snooze-btn')),
        label: h(dur.querySelector('.duration-section-header')),
      };
    });
    for (const target of ['row', 'pill', 'notify', 'snooze'] as const) {
      expect(heights[target], `${target} tap target`).toBeGreaterThanOrEqual(viewport.minTarget);
    }
    expect(heights.label, 'the "Snooze until" label names the pills without taking space').toBeLessThanOrEqual(1);
  });
}
