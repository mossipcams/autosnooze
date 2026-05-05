/**
 * README
 *
 * Covers AutoSnooze view mode, dashboard edit mode, card editor visual pane, YAML pane,
 * invalid YAML validation error state, and the Add Card picker preview on the existing HA
 * dashboard.
 *
 * Update snapshots with:
 * npm run e2e:visual -- --update-snapshots e2e/tests/editor-picker.visual.spec.ts
 *
 * Commit the generated *-snapshots directory with intentional visual changes.
 *
 * Assumptions:
 * - The authenticated HA user can edit `/dashboard-testing/0`.
 * - HA exposes either a visual pane, a YAML pane, or both for the card editor dialog.
 */
import { Locator, Page } from '@playwright/test';
import { authenticatedVisualTest as test, expect } from '../helpers/fixtures';
import {
  EXISTING_DASHBOARD_PATH,
  assertNoCardErrors,
  enterEditMode,
  expectCardReady,
  installCardErrorListeners,
  openAddCardPicker,
  openCardEditor,
} from '../helpers/ha';
import {
  assertLayoutIntegrity,
  freezeTime,
  screenshotOptions,
  stabilizeForVisualSnapshot,
  volatileRegionMasks,
} from '../helpers/visual';

async function switchToYamlPane(dialog: Locator): Promise<boolean> {
  const yamlControl = dialog
    .getByRole('tab', { name: /yaml|code/i })
    .or(dialog.getByRole('button', { name: /yaml|code|show code editor/i }))
    .first();
  if ((await yamlControl.count()) === 0) {
    return false;
  }
  await yamlControl.evaluate((element: HTMLElement) => element.click());
  await expect(dialog).toBeVisible();
  return true;
}

async function switchToVisualPane(dialog: Locator): Promise<boolean> {
  const visualControl = dialog
    .getByRole('tab', { name: /visual|editor/i })
    .or(dialog.getByRole('button', { name: /visual|show visual editor/i }))
    .first();
  if ((await visualControl.count()) === 0) {
    return false;
  }
  await visualControl.evaluate((element: HTMLElement) => element.click());
  await expect(dialog).toBeVisible();
  return true;
}

async function submitInvalidYaml(page: Page, dialog: Locator): Promise<void> {
  const editor = dialog.locator('textarea, .cm-content, mwc-textarea, ha-yaml-editor').first();
  await expect(editor).toBeVisible({ timeout: 15000 });
  await editor.evaluate((element: HTMLElement) => {
    if (element instanceof HTMLTextAreaElement) {
      element.value = 'type: custom:autosnooze-card\nthis is not: [valid';
      element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
      return;
    }
    element.textContent = 'type: custom:autosnooze-card\nthis is not: [valid';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
  });
  const saveButton = dialog.getByRole('button', { name: /save|submit|done/i }).first();
  await saveButton.evaluate((element: HTMLElement) => element.click());
  await expect(dialog.getByText(/invalid|error|bad indentation|yaml|validation/i).first()).toBeVisible({
    timeout: 15000,
  });
}

test.describe('Editor, edit mode, and card picker @visual', () => {
  test('captures view mode and dashboard edit mode overlays @visual', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await freezeTime(page);
    const monitor = installCardErrorListeners(page);
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });

    const card = await expectCardReady(page);
    await assertLayoutIntegrity(card);

    await test.step('capture view mode snapshot', async () => {
      await stabilizeForVisualSnapshot(page, card);
      await expect(card).toHaveScreenshot('view-mode.png', {
        ...screenshotOptions,
        mask: volatileRegionMasks(card),
      });
    });

    await test.step('capture dashboard edit mode snapshot', async () => {
      await enterEditMode(page);
      await page.waitForLoadState('networkidle');
      await expect(card).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot('dashboard-edit-mode.png', screenshotOptions);
    });

    await test.step('assert no card-origin errors', async () => {
      assertNoCardErrors(monitor);
    });
  });

  test('captures the visual pane, YAML pane, and invalid YAML validation error @visual', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await freezeTime(page);
    const monitor = installCardErrorListeners(page);
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });

    const card = await expectCardReady(page);
    await enterEditMode(page);
    const dialog = await openCardEditor(page, card);

    await test.step('capture visual pane snapshot', async () => {
      await switchToVisualPane(dialog);
      await page.waitForLoadState('networkidle');
      await expect(dialog).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(dialog).toHaveScreenshot('card-editor-visual-pane.png', screenshotOptions);
    });

    await test.step('capture YAML pane snapshot and validation error state', async () => {
      const hasYamlPane = await switchToYamlPane(dialog);
      expect(hasYamlPane, 'YAML pane is available for invalid YAML validation error coverage').toBe(true);
      await expect(dialog).toHaveScreenshot('card-editor-yaml-pane.png', screenshotOptions);
      await submitInvalidYaml(page, dialog);
      await expect(dialog).toHaveScreenshot('card-editor-invalid-yaml-validation-error.png', screenshotOptions);
    });

    await test.step('assert no card-origin errors', async () => {
      assertNoCardErrors(monitor);
    });
  });

  test("captures the Add Card picker preview without the Custom element doesn't exist fallback @visual", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await freezeTime(page);
    const monitor = installCardErrorListeners(page);
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });
    await expectCardReady(page);

    const picker = await openAddCardPicker(page);
    const search = picker.getByRole('searchbox').or(picker.getByRole('textbox', { name: /search/i })).first();
    if ((await search.count()) > 0) {
      await search.fill('AutoSnooze');
    }
    await expect(picker.getByText(/AutoSnooze/i).first()).toBeVisible({ timeout: 15000 });
    await expect(picker.getByText(/Custom element doesn't exist/i)).toHaveCount(0);

    await test.step('capture Add Card picker preview tile', async () => {
      await page.waitForLoadState('networkidle');
      await expect(picker).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(picker).toHaveScreenshot('add-card-picker-autosnooze-preview.png', screenshotOptions);
    });

    await test.step('assert no card-origin errors', async () => {
      assertNoCardErrors(monitor);
    });
  });
});
