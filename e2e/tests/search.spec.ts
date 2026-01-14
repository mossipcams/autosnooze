import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Search Filtering', () => {
  test('search filters automation list', async ({ autosnoozeCard }) => {
    const initialCount = await autosnoozeCard.getAutomationCount();

    await autosnoozeCard.search('motion');

    const filteredCount = await autosnoozeCard.getAutomationCount();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Verify all visible items contain "motion"
    const allMatch = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.list-item');
        for (const item of items || []) {
          if (!item.textContent?.toLowerCase().includes('motion')) {
            return false;
          }
        }
        return true;
      })()
      `
    );

    expect(allMatch).toBe(true);
  });

  test('search is case insensitive', async ({ autosnoozeCard }) => {
    await autosnoozeCard.search('LIVING');

    const count = await autosnoozeCard.getAutomationCount();
    expect(count).toBeGreaterThan(0);

    const hasMatch = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.list-item');
        for (const item of items || []) {
          if (item.textContent?.toLowerCase().includes('living')) {
            return true;
          }
        }
        return false;
      })()
      `
    );

    expect(hasMatch).toBe(true);
  });

  test('search with no results shows empty message', async ({ autosnoozeCard }) => {
    await autosnoozeCard.search('zzz-nonexistent-automation-zzz');

    const hasEmptyMessage = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.list-empty') !== null;
      })()
      `
    );

    expect(hasEmptyMessage).toBe(true);
  });

  test('clear search restores full list', async ({ autosnoozeCard }) => {
    const initialCount = await autosnoozeCard.getAutomationCount();

    await autosnoozeCard.search('living');
    const filteredCount = await autosnoozeCard.getAutomationCount();
    expect(filteredCount).toBeLessThan(initialCount);

    await autosnoozeCard.clearSearch();
    const restoredCount = await autosnoozeCard.getAutomationCount();

    expect(restoredCount).toBe(initialCount);
  });

  test('search works across different tabs', async ({ autosnoozeCard }) => {
    await autosnoozeCard.search('motion');

    // Check in All tab
    await autosnoozeCard.switchToTab('all');
    const allCount = await autosnoozeCard.getAutomationCount();
    expect(allCount).toBeGreaterThan(0);

    // Check in Areas tab (search should persist)
    await autosnoozeCard.switchToTab('areas');
    const activeTab = await autosnoozeCard.getActiveTab();
    expect(activeTab).toBe('areas');
  });

  test('search by partial name works', async ({ autosnoozeCard }) => {
    await autosnoozeCard.search('kit');

    const count = await autosnoozeCard.getAutomationCount();
    expect(count).toBeGreaterThan(0);
  });

  test('search filters by automation name containing search term', async ({ autosnoozeCard }) => {
    // Search for 'bed' which should match 'Bedroom'
    await autosnoozeCard.search('bed');

    const count = await autosnoozeCard.getAutomationCount();
    expect(count).toBeGreaterThan(0);

    // Verify all visible items contain the search term
    const allMatch = await autosnoozeCard.page.evaluate(
      `
      (() => {
        const findAutosnoozeCard = () => {
          const findCard = (root) => {
            const card = root.querySelector('autosnooze-card');
            if (card) return card;
            const elements = root.querySelectorAll('*');
            for (const el of elements) {
              if (el.shadowRoot) {
                const found = findCard(el.shadowRoot);
                if (found) return found;
              }
            }
            return null;
          };
          return findCard(document);
        };
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.list-item');
        for (const item of items || []) {
          if (!item.textContent?.toLowerCase().includes('bed')) {
            return false;
          }
        }
        return true;
      })()
      `
    );
    expect(allMatch).toBe(true);
  });

  test('selecting automation after search and snoozing works', async ({ autosnoozeCard }) => {
    // Search to filter list
    await autosnoozeCard.search('living');

    // Verify we have filtered results
    const count = await autosnoozeCard.getAutomationCount();
    expect(count).toBeGreaterThan(0);

    // Select the first visible automation
    await autosnoozeCard.selectAutomationByIndex(0);

    // Verify selection was made
    const selectedCount = await autosnoozeCard.getSelectedCount();
    expect(selectedCount).toBe(1);

    // Snooze the selected automation
    await autosnoozeCard.selectDuration('1h');
    await autosnoozeCard.snooze();

    // Verify it was snoozed
    await autosnoozeCard.expectPausedCount(1);
  });
});
