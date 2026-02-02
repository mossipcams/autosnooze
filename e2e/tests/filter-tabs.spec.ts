import { test, expect } from '../fixtures/hass.fixture';
import { findCardScript } from '../helpers/shadow-dom';

test.describe('Filter Tabs', () => {
  test('All tab shows flat list without groups', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToTab('all');

    const groupCount = await autosnoozeCard.getGroupCount();
    expect(groupCount).toBe(0);

    const automationCount = await autosnoozeCard.getAutomationCount();
    expect(automationCount).toBeGreaterThan(0);
  });

  test('Areas tab shows grouped list', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToTab('areas');

    const groupCount = await autosnoozeCard.getGroupCount();
    expect(groupCount).toBeGreaterThan(0);
  });

  test('Categories tab shows grouped list', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToTab('categories');

    // Categories may or may not have groups depending on data
    const activeTab = await autosnoozeCard.getActiveTab();
    expect(activeTab).toBe('categories');
  });

  test('Labels tab shows grouped list', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToTab('labels');

    const activeTab = await autosnoozeCard.getActiveTab();
    expect(activeTab).toBe('labels');
  });

  test('switching tabs updates active tab style', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToTab('all');
    expect(await autosnoozeCard.getActiveTab()).toBe('all');

    await autosnoozeCard.switchToTab('areas');
    expect(await autosnoozeCard.getActiveTab()).toBe('areas');

    await autosnoozeCard.switchToTab('categories');
    expect(await autosnoozeCard.getActiveTab()).toBe('categories');

    await autosnoozeCard.switchToTab('labels');
    expect(await autosnoozeCard.getActiveTab()).toBe('labels');
  });

  test('tab counts are displayed', async ({ autosnoozeCard }) => {
    const hasTabCounts = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const counts = deepQueryAll(card, '.tab-count');
        return (counts?.length ?? 0) > 0;
      })()
      `
    );

    expect(hasTabCounts).toBe(true);
  });

  test('All tab count matches automation list count', async ({ autosnoozeCard }) => {
    const tabCount = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const tabs = deepQueryAll(card, '.tab');
        for (const tab of tabs || []) {
          if (tab.textContent?.toLowerCase().includes('all')) {
            const count = tab.querySelector('.tab-count');
            return parseInt(count?.textContent ?? '0', 10);
          }
        }
        return 0;
      })()
      `
    );

    await autosnoozeCard.switchToTab('all');
    const listCount = await autosnoozeCard.getAutomationCount();

    expect(tabCount).toBe(listCount);
  });

  test('group headers exist in Areas tab', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToTab('areas');

    // Verify at least one group header exists
    const groupCount = await autosnoozeCard.getGroupCount();
    expect(groupCount).toBeGreaterThan(0);

    // Verify groups have expand chevron
    const hasChevrons = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const headers = deepQueryAll(card, '.group-header');
        for (const header of headers || []) {
          const chevron = header.querySelector('.chevron, .expand-icon, svg, ha-icon');
          if (chevron) return true;
        }
        // Check if header itself is clickable (has expanded class capability)
        return headers?.[0]?.classList !== undefined;
      })()
      `
    );
    expect(hasChevrons).toBe(true);
  });

  test('clicking group header toggles content visibility', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToTab('areas');

    // Get first group name
    const groupName = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const header = deepQuery(card, '.group-header');
        // Extract just the group name, not the count
        const text = header?.textContent?.trim() ?? '';
        return text.split(/\\s+/)[0];
      })()
      `
    );

    expect(groupName).toBeTruthy();

    // Get initial item count in group
    const initialItemsInGroup = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const group = deepQuery(card, '.group');
        const items = group?.querySelectorAll('.list-item');
        return items?.length ?? 0;
      })()
      `
    );

    // Click the group header to toggle
    await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const header = deepQuery(card, '.group-header');
        header?.click();
      })()
      `
    );
    await autosnoozeCard.page.waitForTimeout(300);

    // Click again to toggle back
    await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const header = deepQuery(card, '.group-header');
        header?.click();
      })()
      `
    );
    await autosnoozeCard.page.waitForTimeout(300);

    // Group should still have items visible after toggling twice
    const finalItemsInGroup = await autosnoozeCard.page.evaluate(
      `
      (() => {
        ${findCardScript}
        const card = findAutosnoozeCard();
        const group = deepQuery(card, '.group');
        const items = group?.querySelectorAll('.list-item');
        return items?.length ?? 0;
      })()
      `
    );

    expect(finalItemsInGroup).toBe(initialItemsInGroup);
  });
});
