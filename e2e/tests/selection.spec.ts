import { test, expect } from '../fixtures/hass.fixture';

test.describe('Selection', () => {
  test.beforeEach(async ({ resetAutomations }) => {
    // Ensure clean state
  });

  test('clicking automation item selects it', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');

    const isSelected = await autosnoozeCard.isAutomationSelected('Living Room Motion Lights');
    expect(isSelected).toBe(true);

    const count = await autosnoozeCard.getSelectedCount();
    expect(count).toBe(1);
  });

  test('clicking selected automation deselects it', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');

    const isSelected = await autosnoozeCard.isAutomationSelected('Living Room Motion Lights');
    expect(isSelected).toBe(false);

    const count = await autosnoozeCard.getSelectedCount();
    expect(count).toBe(0);
  });

  test('multiple automations can be selected', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectAutomation('Kitchen Motion Lights');
    await autosnoozeCard.selectAutomation('Bedroom Motion Lights');

    const count = await autosnoozeCard.getSelectedCount();
    expect(count).toBe(3);
  });

  test('clear removes all selections', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAll();
    await autosnoozeCard.clearSelection();

    const count = await autosnoozeCard.getSelectedCount();
    expect(count).toBe(0);
  });

  test('selection enables snooze button', async ({ autosnoozeCard }) => {
    await autosnoozeCard.expectSnoozeButtonDisabled();

    await autosnoozeCard.selectAutomation('Living Room Motion Lights');

    await autosnoozeCard.expectSnoozeButtonEnabled();
  });

  test('selection persists across tab changes', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.switchToTab('areas');
    await autosnoozeCard.switchToTab('all');

    const isSelected = await autosnoozeCard.isAutomationSelected('Living Room Motion Lights');
    expect(isSelected).toBe(true);
  });

  test('selection actions container exists', async ({ autosnoozeCard }) => {
    // Verify selection actions area exists (contains select all / clear buttons)
    const hasSelectionActions = await autosnoozeCard.page.evaluate(
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
        // Check for selection-related UI elements
        return card?.shadowRoot?.querySelector('.selection-actions') !== null ||
               card?.shadowRoot?.querySelector('[role="status"]') !== null;
      })()
      `
    );
    expect(hasSelectionActions).toBe(true);
  });

  test('selecting automation in Areas tab works', async ({ autosnoozeCard }) => {
    await autosnoozeCard.switchToTab('areas');

    // Wait for groups to load
    await autosnoozeCard.page.waitForTimeout(300);

    // Select first visible automation in any group
    await autosnoozeCard.selectAutomationByIndex(0);

    // Verify selection count increased
    const count = await autosnoozeCard.getSelectedCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
