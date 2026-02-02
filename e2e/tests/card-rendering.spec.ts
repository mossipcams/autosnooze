import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Card Rendering', () => {
  test('displays card with header', async ({ autosnoozeCard }) => {
    const headerText = await autosnoozeCard.getHeaderText();
    expect(headerText.toLowerCase()).toContain('autosnooze');
  });

  test('displays all filter tabs', async ({ autosnoozeCard }) => {
    const tabs = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const tabElements = deepQueryAll(card, '.tab');
        return Array.from(tabElements || []).map((t) => t.textContent?.toLowerCase() ?? '');
      })()
      `
    );

    expect(tabs.some((t: string) => t.includes('all'))).toBe(true);
    expect(tabs.some((t: string) => t.includes('areas'))).toBe(true);
    expect(tabs.some((t: string) => t.includes('categories'))).toBe(true);
    expect(tabs.some((t: string) => t.includes('labels'))).toBe(true);
  });

  test('displays search input', async ({ autosnoozeCard }) => {
    const hasSearch = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const input = deepQuery(card, '.search-box input');
        return input !== null;
      })()
      `
    );
    expect(hasSearch).toBe(true);
  });

  test('displays duration pills', async ({ autosnoozeCard }) => {
    const pills = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const pillElements = deepQueryAll(card, '.pill');
        return Array.from(pillElements || []).map((p) => p.textContent?.trim() ?? '');
      })()
      `
    );

    expect(pills).toContain('30m');
    expect(pills).toContain('1h');
    expect(pills).toContain('1d');
    expect(pills).toContain('Custom');
  });

  test('displays automation list', async ({ autosnoozeCard, resetAutomations: _resetAutomations }) => {
    const count = await autosnoozeCard.getAutomationCount();
    expect(count).toBeGreaterThan(0);
  });

  test('snooze button is disabled when no selection', async ({ autosnoozeCard }) => {
    await autosnoozeCard.clearSelection();
    await autosnoozeCard.expectSnoozeButtonDisabled();
  });

  test('default tab is All', async ({ autosnoozeCard }) => {
    const activeTab = await autosnoozeCard.getActiveTab();
    expect(activeTab).toBe('all');
  });

  test('default duration is 30m', async ({ autosnoozeCard }) => {
    const activePill = await autosnoozeCard.getActiveDurationPill();
    expect(activePill).toBe('30m');
  });

  test('last duration badge is hidden initially', async ({ autosnoozeCard }) => {
    const badgeVisible = await autosnoozeCard.isLastDurationBadgeVisible();
    expect(badgeVisible).toBe(false);
  });
});
