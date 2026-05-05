/**
 * README
 *
 * Covers visual sizing and spacing for the existing AutoSnooze card under simulated
 * sections, masonry, and panel layout widths. The existing external HA dashboard is the
 * source of truth; span widths are applied to the loaded card container to make the checks
 * deterministic across Home Assistant installations.
 *
 * Update snapshots with:
 * npm run e2e:visual -- --update-snapshots e2e/tests/layout-grid.visual.spec.ts
 *
 * Commit the generated *-snapshots directory with intentional visual changes.
 */
import { Locator, Page } from '@playwright/test';
import {
  GRID_SPANS,
  LAYOUT_VARIANTS,
  authenticatedVisualTest as test,
  expect,
} from '../helpers/fixtures';
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

const COVERED_GRID_SPAN_NAMES = ['span-1', 'span-2', 'span-4', 'full-width'] as const;

async function setCardWidth(card: Locator, width: number, layoutName: string): Promise<void> {
  await card.evaluate(
    (element, { width, layoutName }) => {
      const htmlElement = element as HTMLElement;
      htmlElement.dataset.visualLayout = layoutName;
      htmlElement.style.display = 'block';
      htmlElement.style.inlineSize = `${width}px`;
      htmlElement.style.maxInlineSize = '100%';
      htmlElement.style.marginInline = 'auto';
    },
    { width, layoutName },
  );
}

async function expectGetCardSizeHeightRoughlyMatches(card: Locator): Promise<void> {
  const metrics = await card.evaluate((element) => {
    const autosnoozeCard = element as HTMLElement & { getCardSize?: () => number };
    const size = autosnoozeCard.getCardSize?.();
    const rect = autosnoozeCard.getBoundingClientRect();
    return { size, height: rect.height };
  });

  expect(Number.isInteger(metrics.size)).toBe(true);
  expect(metrics.size).toBeGreaterThan(0);
  expect(metrics.height, 'height roughly matches getCardSize() * 50px').toBeGreaterThan(metrics.size * 35);
  expect(metrics.height, 'height roughly matches getCardSize() * 50px including HA card chrome').toBeLessThan(
    metrics.size * 225,
  );
}

async function createStackedCardFixture(page: Page): Promise<Locator> {
  await page.evaluate(() => {
    const card = document.querySelector('autosnooze-card') as HTMLElement & {
      hass?: unknown;
      config?: Record<string, unknown>;
      setConfig?: (config: Record<string, unknown>) => void;
      requestUpdate?: () => void;
    };
    if (!card) {
      throw new Error('autosnooze-card is not available for stacked-card spacing fixture');
    }

    const existing = document.querySelector('[data-visual-stack]');
    existing?.remove();

    const stack = document.createElement('div');
    stack.dataset.visualStack = 'true';
    stack.style.display = 'grid';
    stack.style.gap = '12px';
    stack.style.maxWidth = '760px';
    stack.style.margin = '24px auto';

    const stockCard = document.createElement('ha-card');
    stockCard.textContent = 'Visual stock card spacing reference';
    stockCard.style.padding = '16px';
    stockCard.setAttribute('aria-label', 'stock card spacing reference');

    const duplicate = document.createElement('autosnooze-card') as HTMLElement & {
      hass?: unknown;
      setConfig?: (config: Record<string, unknown>) => void;
      requestUpdate?: () => void;
    };
    duplicate.hass = card.hass;
    duplicate.setConfig?.({ ...(card.config ?? {}), title: 'AutoSnooze Stacked Visual Fixture' });
    duplicate.requestUpdate?.();

    stack.append(stockCard, duplicate);
    card.after(stack);
  });

  const stack = page.locator('[data-visual-stack]').first();
  await expect(stack).toBeVisible();
  return stack;
}

test.describe('Layout sizing and grid behavior @visual', () => {
  for (const layout of LAYOUT_VARIANTS) {
    for (const span of GRID_SPANS.filter((candidate) => COVERED_GRID_SPAN_NAMES.includes(candidate.name))) {
      test(`${layout} ${span.name} has no overflow @visual`, async ({ page }) => {
        await test.step('load the existing dashboard', async () => {
          await page.setViewportSize({ width: Math.max(span.width + 80, 411), height: 1024 });
          await freezeTime(page);
        });
        const monitor = installCardErrorListeners(page);
        await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });

        const card = await test.step('apply span width and assert layout integrity', async () => {
          const loadedCard = await expectCardReady(page);
          await setCardWidth(loadedCard, span.width, layout);
          await assertLayoutIntegrity(loadedCard);
          await assertNoHorizontalOverflow(loadedCard);
          await expectGetCardSizeHeightRoughlyMatches(loadedCard);
          return loadedCard;
        });

        await test.step('capture span visual snapshot', async () => {
          await stabilizeForVisualSnapshot(page, card);
          await expect(card).toHaveScreenshot(`${layout}-${span.name}.png`, {
            ...screenshotOptions,
            mask: volatileRegionMasks(card),
          });
        });

        await test.step('assert no card-origin errors', async () => {
          assertNoCardErrors(monitor);
        });
      });
    }
  }
});

test.describe('Stacked-card spacing @visual', () => {
  test('renders with itself and a stock card without spacing defects @visual', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await freezeTime(page);
    const monitor = installCardErrorListeners(page);
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });

    const card = await expectCardReady(page);
    await assertLayoutIntegrity(card);

    const stack = await createStackedCardFixture(page);

    await test.step('capture stacked-card spacing snapshot', async () => {
      await page.waitForLoadState('networkidle');
      await expect(stack).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(stack).toHaveScreenshot('stacked-card-spacing.png', screenshotOptions);
    });

    await test.step('assert no card-origin errors', async () => {
      assertNoCardErrors(monitor);
    });
  });
});
