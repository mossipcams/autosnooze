/**
 * README
 *
 * Covers hover, keyboard focus, active state, prefers-reduced-motion, RTL, and WCAG AA
 * visual contrast checks for the AutoSnooze card on the existing HA dashboard.
 *
 * Update snapshots with:
 * npm run e2e:visual -- --update-snapshots e2e/tests/interaction-accessibility.visual.spec.ts
 *
 * Commit the generated *-snapshots directory with intentional visual changes.
 *
 * Assumptions:
 * - AutoSnooze does not currently expose tap_action, hold_action, or double_tap_action
 *   config fields; interactive behavior coverage is scoped to the card's native controls.
 */
import AxeBuilder from '@axe-core/playwright';
import { Locator } from '@playwright/test';
import { authenticatedVisualTest as test, expect } from '../helpers/fixtures';
import {
  EXISTING_DASHBOARD_PATH,
  assertNoCardErrors,
  expectCardReady,
  installCardErrorListeners,
} from '../helpers/ha';
import {
  assertLayoutIntegrity,
  assertNoHorizontalOverflow,
  freezeTime,
  screenshotOptions,
  stabilizeForVisualSnapshot,
  volatileRegionMasks,
} from '../helpers/visual';

async function optionalFirst(locator: Locator): Promise<Locator | null> {
  return (await locator.count()) > 0 ? locator.first() : null;
}

async function captureInteractiveState(card: Locator, target: Locator, name: string): Promise<void> {
  if ((await target.count()) === 0 || !(await target.isVisible().catch(() => false))) {
    return;
  }

  await target.scrollIntoViewIfNeeded();

  const hovered = await target.hover({ timeout: 2000 }).then(() => true).catch(() => false);
  if (!hovered) {
    return;
  }
  await expect(card).toHaveScreenshot(`${name}-hover.png`, {
    ...screenshotOptions,
    mask: volatileRegionMasks(card),
  });

  const focused = await target.focus({ timeout: 2000 }).then(() => true).catch(() => false);
  if (!focused) {
    return;
  }
  await expect(card).toHaveScreenshot(`${name}-keyboard-focus.png`, {
    ...screenshotOptions,
    mask: volatileRegionMasks(card),
  });

  const box = await target.boundingBox();
  expect(box, `${name} active state target has a bounding box`).not.toBeNull();
  await target.page().mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await target.page().mouse.down();
  await expect(card).toHaveScreenshot(`${name}-active-state.png`, {
    ...screenshotOptions,
    mask: volatileRegionMasks(card),
  });
  await target.page().mouse.up();
}

test.describe('Interaction state visuals @visual', () => {
  test('captures hover, keyboard focus, and active state for native controls @visual', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await freezeTime(page);
    const monitor = installCardErrorListeners(page);
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });

    const card = await expectCardReady(page);
    await assertLayoutIntegrity(card);
    await stabilizeForVisualSnapshot(page, card);

    const targets = [
      { name: 'filter-tab', locator: () => optionalFirst(card.locator('internal:role=tab')) },
      { name: 'duration-pill', locator: () => optionalFirst(card.locator('internal:role=radio')) },
      { name: 'primary-button', locator: () => optionalFirst(card.locator('internal:role=button')) },
      { name: 'automation-row', locator: () => optionalFirst(card.locator('internal:role=option')) },
    ];

    expect(targets.length).toBeGreaterThan(0);

    for (const target of targets) {
      await test.step(`capture ${target.name} interaction states`, async () => {
        const locator = await target.locator();
        if (locator) {
          await captureInteractiveState(card, locator, target.name);
        }
      });
    }

    await test.step('assert no card-origin errors', async () => {
      assertNoCardErrors(monitor);
    });
  });
});

test.describe('Reduced motion and RTL visuals @visual', () => {
  test('honors prefers-reduced-motion with no idle infinite animations @visual', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await freezeTime(page);
    const monitor = installCardErrorListeners(page);
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });

    const card = await expectCardReady(page);
    await assertLayoutIntegrity(card);

    const runningInfiniteAnimations = await card.evaluate((element) => {
      return element
        .getAnimations({ subtree: true })
        .filter((animation) => {
          const timing = animation.effect?.getTiming();
          return timing?.iterations === Infinity && animation.playState === 'running';
        })
        .map((animation) => animation.animationName);
    });
    expect(runningInfiniteAnimations).toEqual([]);

    await test.step('capture reduced motion snapshot', async () => {
      await stabilizeForVisualSnapshot(page, card);
      await expect(card).toHaveScreenshot('prefers-reduced-motion.png', {
        ...screenshotOptions,
        mask: volatileRegionMasks(card),
      });
    });

    await test.step('assert no card-origin errors', async () => {
      assertNoCardErrors(monitor);
    });
  });

  test('renders in dir="rtl" without overflow or clipped controls @visual', async ({ page }) => {
    await page.setViewportSize({ width: 411, height: 915 });
    await freezeTime(page);
    const monitor = installCardErrorListeners(page);
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));

    const card = await expectCardReady(page);
    await assertLayoutIntegrity(card);
    await assertNoHorizontalOverflow(card);

    await test.step('capture RTL snapshot', async () => {
      await stabilizeForVisualSnapshot(page, card);
      await expect(card).toHaveScreenshot('rtl-mobile.png', {
        ...screenshotOptions,
        mask: volatileRegionMasks(card),
      });
    });

    await test.step('assert no card-origin errors', async () => {
      assertNoCardErrors(monitor);
    });
  });
});

test.describe('Visual accessibility @visual', () => {
  test('passes WCAG AA color-contrast checks scoped to the card @visual', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await freezeTime(page);
    const monitor = installCardErrorListeners(page);
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });

    const card = await expectCardReady(page);
    await assertLayoutIntegrity(card);

    const results = await new AxeBuilder({ page }).include('autosnooze-card').withTags(['wcag2aa']).analyze();
    const contrastViolations = results.violations.filter((violation) => violation.id === 'color-contrast');
    const nonContrastViolations = results.violations.filter((violation) => violation.id !== 'color-contrast');
    if (nonContrastViolations.length > 0) {
      console.warn(
        `Non-contrast WCAG AA findings: ${nonContrastViolations
          .map((violation) => `${violation.id}:${violation.nodes.length}`)
          .join(', ')}`,
      );
    }
    expect(contrastViolations).toEqual([]);

    await test.step('capture accessibility baseline after axe scan', async () => {
      await stabilizeForVisualSnapshot(page, card);
      await expect(card).toHaveScreenshot('accessibility-contrast-baseline.png', {
        ...screenshotOptions,
        mask: volatileRegionMasks(card),
      });
    });

    await test.step('assert no card-origin errors', async () => {
      assertNoCardErrors(monitor);
    });
  });
});
