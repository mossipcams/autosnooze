/**
 * README
 *
 * Covers visual regression for the inferred AutoSnooze config variants across HA-relevant
 * mobile, tablet, desktop, and wide viewports under light, dark, and fixture community theme
 * custom-property values on the existing `/dashboard-testing/0` dashboard.
 *
 * Update snapshots with:
 * npm run e2e:visual -- --update-snapshots e2e/tests/rendering-matrix.visual.spec.ts
 *
 * Commit the generated *-snapshots directory with intentional visual changes.
 *
 * Assumptions:
 * - The card config schema only exposes `title`, based on `src/types/card.ts`.
 * - The existing HA dashboard contains at least one `autosnooze-card`.
 */
import { Locator, Page } from '@playwright/test';
import {
  CARD_CONFIG_VARIANTS,
  VISUAL_THEMES,
  VISUAL_VIEWPORTS,
  authenticatedVisualTest as test,
  expect,
} from '../helpers/fixtures';
import {
  CARD_ELEMENT_NAME,
  EXISTING_DASHBOARD_PATH,
  assertNoCardErrors,
  expectCardReady,
  installCardErrorListeners,
} from '../helpers/ha';
import {
  assertLayoutIntegrity,
  freezeTime,
  screenshotOptions,
  stabilizeForVisualSnapshot,
  volatileRegionMasks,
} from '../helpers/visual';

type ThemeName = (typeof VISUAL_THEMES)[number]['name'];

const THEME_VARIABLES: Record<ThemeName, Record<string, string>> = {
  light: {
    '--primary-color': '#03a9f4',
    '--card-background-color': '#ffffff',
    '--primary-text-color': '#212121',
    '--secondary-text-color': '#727272',
    '--divider-color': '#e0e0e0',
    '--state-icon-color': '#44739e',
    '--secondary-background-color': '#f5f5f5',
  },
  dark: {
    '--primary-color': '#8ab4f8',
    '--card-background-color': '#1f1f1f',
    '--primary-text-color': '#f1f3f4',
    '--secondary-text-color': '#bdc1c6',
    '--divider-color': '#3c4043',
    '--state-icon-color': '#9aa0a6',
    '--secondary-background-color': '#121212',
  },
  community: {
    '--primary-color': '#00a878',
    '--card-background-color': '#101820',
    '--primary-text-color': '#f7fff7',
    '--secondary-text-color': '#b8d8d8',
    '--divider-color': '#284b63',
    '--state-icon-color': '#ffd166',
    '--secondary-background-color': '#172a3a',
  },
};

async function applyThemeFixture(page: Page, themeName: ThemeName): Promise<void> {
  await page.evaluate(
    ({ variables, name }) => {
      document.querySelectorAll('[data-autosnooze-theme-fixture]').forEach((element) => element.remove());

      const style = document.createElement('style');
      style.dataset.autosnoozeThemeFixture = name;
      style.textContent = `
        html, body, home-assistant, autosnooze-card {
          ${Object.entries(variables)
            .map(([property, value]) => `${property}: ${value};`)
            .join('\n')}
        }
        body {
          background: var(--secondary-background-color);
          color: var(--primary-text-color);
        }
      `;
      document.head.append(style);

      const themedElements = [
        document.documentElement,
        document.body,
        document.querySelector('home-assistant'),
        ...Array.from(document.querySelectorAll('autosnooze-card')),
      ].filter((element): element is HTMLElement => element instanceof HTMLElement);

      for (const element of themedElements) {
        for (const [property, value] of Object.entries(variables)) {
          element.style.setProperty(property, value);
        }
      }
    },
    { variables: THEME_VARIABLES[themeName], name: themeName },
  );
  await page.locator(CARD_ELEMENT_NAME).evaluateAll(
    (cards, variables) => {
      for (const card of cards) {
        if (!(card instanceof HTMLElement)) {
          continue;
        }
        for (const [property, value] of Object.entries(variables)) {
          card.style.setProperty(property, value);
        }
        const haCard = card.shadowRoot?.querySelector('ha-card') as HTMLElement | null;
        if (haCard) {
          haCard.style.setProperty('background', variables['--card-background-color'], 'important');
          haCard.style.setProperty('background-color', variables['--card-background-color'], 'important');
          haCard.style.color = 'var(--primary-text-color)';
        }
        const litCard = card as HTMLElement & { requestUpdate?: () => void };
        litCard.requestUpdate?.();
      }
    },
    THEME_VARIABLES[themeName],
  );
}

async function applyCardConfig(page: Page, config: Record<string, unknown>): Promise<void> {
  await page.evaluate((config) => {
    const card = document.querySelector('autosnooze-card') as HTMLElement & {
      setConfig?: (config: Record<string, unknown>) => void;
      requestUpdate?: () => void;
    };
    if (!card?.setConfig) {
      throw new Error('autosnooze-card setConfig is not available');
    }
    card.setConfig(config);
    card.requestUpdate?.();
  }, config);
}

async function readComputedCardStyles(cardLocator: Locator): Promise<Record<string, string>> {
  return await cardLocator.evaluate((card) => {
    const root = card?.shadowRoot;
    const haCard = root?.querySelector('ha-card') as HTMLElement | null;
    const header = root?.querySelector('.header') as HTMLElement | null;
    const button = root?.querySelector('.snooze-btn') as HTMLElement | null;

    if (!card || !haCard || !header || !button) {
      throw new Error('Autosnooze computed style targets are not available');
    }

    const cardStyle = getComputedStyle(haCard);
    const headerStyle = getComputedStyle(header);
    const buttonStyle = getComputedStyle(button);
    const hostStyle = getComputedStyle(card as HTMLElement);

    return {
      cardBackground: hostStyle.getPropertyValue('--card-background-color').trim(),
      surfaceBackground: cardStyle.backgroundColor,
      headerColor: headerStyle.color,
      buttonBackground: buttonStyle.backgroundColor,
      buttonColor: buttonStyle.color,
      primaryColor: hostStyle.getPropertyValue('--primary-color').trim(),
      dividerColor: hostStyle.getPropertyValue('--divider-color').trim(),
    };
  });
}

for (const variant of CARD_CONFIG_VARIANTS) {
  test.describe(`Rendering matrix: ${variant.name} @visual`, () => {
    for (const viewport of VISUAL_VIEWPORTS) {
      for (const theme of VISUAL_THEMES) {
        test(`${variant.name} ${viewport.name} ${theme.name} snapshot @visual`, async ({ page }) => {
          await test.step('prepare viewport, time, and error monitoring', async () => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await freezeTime(page);
          });
          const monitor = installCardErrorListeners(page);

          await test.step('load the existing dashboard and apply visual scenario inputs', async () => {
            await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });
            await applyThemeFixture(page, theme.name);
          });

          const card = await test.step('wait for card and assert layout integrity', async () => {
            const loadedCard = await expectCardReady(page);
            await applyThemeFixture(page, theme.name);
            await applyCardConfig(page, variant.config);
            await assertLayoutIntegrity(loadedCard);
            return loadedCard;
          });

          await test.step('capture card screenshot with volatile regions masked', async () => {
            await stabilizeForVisualSnapshot(page, card);
            await expect(card).toHaveScreenshot(`${variant.name}-${viewport.name}-${theme.name}.png`, {
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
}

test.describe('Theme compliance @visual', () => {
  test('computed styles differ between themes @visual', async ({ page }) => {
    await freezeTime(page);
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });

    await applyThemeFixture(page, 'light');
    const lightCard = await expectCardReady(page);
    await applyThemeFixture(page, 'light');
    const lightStyles = await readComputedCardStyles(lightCard);

    await applyThemeFixture(page, 'dark');
    const darkCard = await expectCardReady(page);
    await applyThemeFixture(page, 'dark');
    const darkStyles = await readComputedCardStyles(darkCard);

    await applyThemeFixture(page, 'community');
    const communityCard = await expectCardReady(page);
    await applyThemeFixture(page, 'community');
    const communityStyles = await readComputedCardStyles(communityCard);

    expect(lightStyles.cardBackground).not.toBe(darkStyles.cardBackground);
    expect(lightStyles.headerColor).not.toBe(darkStyles.headerColor);
    expect(lightStyles.buttonBackground).not.toBe(darkStyles.buttonBackground);
    expect(darkStyles.primaryColor).not.toBe(communityStyles.primaryColor);
    expect(darkStyles.dividerColor).not.toBe(communityStyles.dividerColor);
  });
});
