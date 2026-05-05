import { expect, Locator, Page } from '@playwright/test';

export const screenshotOptions = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
  maxDiffPixelRatio: 0.01,
};

type Offender = {
  tag: string;
  className: string;
  text: string;
  detail: string;
};

function collectLayoutOffendersInBrowser(rootElement: Element, mode: string): Offender[] {
  const offenders: Offender[] = [];
  const cardRect = rootElement.getBoundingClientRect();

  const visit = (root: ParentNode): void => {
    root.querySelectorAll('*').forEach((element) => {
      const htmlElement = element as HTMLElement;
      const style = window.getComputedStyle(htmlElement);
      const rect = htmlElement.getBoundingClientRect();
      const text = (htmlElement.textContent ?? '').replace(/\s+/g, ' ').trim();
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';

      if (mode === 'overflow' && htmlElement.scrollWidth > htmlElement.clientWidth + 1) {
        offenders.push({
          tag: htmlElement.tagName.toLowerCase(),
          className: htmlElement.className.toString(),
          text: text.slice(0, 80),
          detail: `${htmlElement.scrollWidth} > ${htmlElement.clientWidth}`,
        });
      }

      if (mode === 'zero-sized-text' && visible && text && (rect.width === 0 || rect.height === 0)) {
        offenders.push({
          tag: htmlElement.tagName.toLowerCase(),
          className: htmlElement.className.toString(),
          text: text.slice(0, 80),
          detail: `${rect.width}x${rect.height}`,
        });
      }

      if (
        mode === 'out-of-bounds' &&
        visible &&
        rect.width > 0 &&
        rect.height > 0 &&
        (rect.left < cardRect.left - 1 || rect.right > cardRect.right + 1 || rect.top < cardRect.top - 1)
      ) {
        offenders.push({
          tag: htmlElement.tagName.toLowerCase(),
          className: htmlElement.className.toString(),
          text: text.slice(0, 80),
          detail: `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.right)},${Math.round(rect.bottom)}`,
        });
      }

      if (htmlElement.shadowRoot) {
        visit(htmlElement.shadowRoot);
      }
    });
  };

  if (rootElement.shadowRoot) {
    visit(rootElement.shadowRoot);
  } else {
    visit(rootElement);
  }

  return offenders;
}

export const assertNoHorizontalOverflow = async (card: Locator): Promise<void> => {
  const offenders = await card.evaluate(collectLayoutOffendersInBrowser, 'overflow');
  expect(offenders, 'elements with horizontal overflow inside the card').toEqual([]);
};

export const assertNoBrokenImages = async (card: Locator): Promise<void> => {
  const brokenImages = await card.evaluate((element) => {
    const images = Array.from(element.shadowRoot?.querySelectorAll('img') ?? element.querySelectorAll('img'));
    return images
      .filter((image) => image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt);
  });

  expect(brokenImages, 'broken images inside the card').toEqual([]);
};

export const assertNoZeroSizedVisibleElements = async (card: Locator): Promise<void> => {
  const offenders = await card.evaluate(collectLayoutOffendersInBrowser, 'zero-sized-text');
  expect(offenders, 'visible text rendered at zero size inside the card').toEqual([]);
};

export const assertNoOutOfBoundsElements = async (card: Locator): Promise<void> => {
  const offenders = await card.evaluate(collectLayoutOffendersInBrowser, 'out-of-bounds');
  expect(offenders, 'elements rendered outside the card bounds').toEqual([]);
};

export const assertLayoutIntegrity = async (card: Locator): Promise<void> => {
  await assertNoHorizontalOverflow(card);
  await assertNoBrokenImages(card);
  await assertNoZeroSizedVisibleElements(card);
  await assertNoOutOfBoundsElements(card);
};

export const freezeTime = async (page: Page, isoTime = '2026-05-05T12:00:00.000Z'): Promise<void> => {
  if (page.clock) {
    await page.clock.install({ time: new Date(isoTime) });
    return;
  }

  await page.addInitScript((timestamp) => {
    const fixed = new Date(timestamp).getTime();
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? fixed);
      }
      static now() {
        return fixed;
      }
    }
    window.Date = FixedDate as DateConstructor;
  }, isoTime);
};

export const stabilizeForVisualSnapshot = async (page: Page, card: Locator): Promise<void> => {
  await page.waitForLoadState('networkidle');
  await expect(card).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
};

export const volatileRegionMasks = (card: Locator): Locator[] => [
  card.locator('.countdown'),
  card.locator('.paused-time'),
  card.locator('.scheduled-time'),
  card.locator('.duration-preview'),
  card.locator('[data-testid*="time"]'),
  card.locator('[aria-live="polite"]'),
];
