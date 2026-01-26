import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

// Helper function to find autosnooze-card through nested shadow DOMs
const findAutosnoozeCard = `
  function findAutosnoozeCard() {
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
  }
`;

// Default timeout for waiting operations
const DEFAULT_WAIT_TIMEOUT = 10000;

export class AutoSnoozeCard extends BasePage {
  readonly card: Locator;

  // Filter tabs
  readonly tabAll: Locator;
  readonly tabAreas: Locator;
  readonly tabCategories: Locator;
  readonly tabLabels: Locator;

  // Search
  readonly searchInput: Locator;

  // Selection
  readonly selectAllButton: Locator;
  readonly clearButton: Locator;
  readonly selectionCount: Locator;

  // Duration controls
  readonly durationPills: Locator;
  readonly customDurationInput: Locator;

  // Last duration badge
  get shadowRoot() {
    return this.card;
  }

  // Schedule mode
  readonly scheduleLink: Locator;
  readonly disableAtDate: Locator;
  readonly disableAtTime: Locator;
  readonly resumeAtDate: Locator;
  readonly resumeAtTime: Locator;

  // Actions
  readonly snoozeButton: Locator;
  readonly wakeAllButton: Locator;

  // Lists
  readonly automationList: Locator;
  readonly pausedList: Locator;
  readonly scheduledList: Locator;

  // Toast
  readonly toast: Locator;
  readonly undoButton: Locator;

  constructor(page: Page) {
    super(page);

    this.card = page.locator('autosnooze-card');

    // Filter tabs - use internal: prefix for shadow DOM piercing in Playwright
    this.tabAll = this.card.locator('internal:role=tab[name=/All/i]');
    this.tabAreas = this.card.locator('internal:role=tab[name=/Areas/i]');
    this.tabCategories = this.card.locator('internal:role=tab[name=/Categories/i]');
    this.tabLabels = this.card.locator('internal:role=tab[name=/Labels/i]');

    this.searchInput = this.card.locator('internal:role=searchbox');

    this.selectAllButton = this.card.locator('internal:role=button[name=/Select All/i]');
    this.clearButton = this.card.locator('internal:role=button[name=/Clear/i]');
    this.selectionCount = this.card.locator('internal:role=status');

    this.durationPills = this.card.locator('internal:role=radio');
    this.customDurationInput = this.card.locator('internal:role=textbox[name=/duration/i]');

    this.scheduleLink = this.card.locator('internal:role=link');

    this.disableAtDate = this.card.locator('internal:role=combobox[name=/Snooze date/i]');
    this.disableAtTime = this.card.locator('internal:role=textbox[name=/Snooze time/i]');
    this.resumeAtDate = this.card.locator('internal:role=combobox[name=/Resume date/i]');
    this.resumeAtTime = this.card.locator('internal:role=textbox[name=/Resume time/i]');

    this.snoozeButton = this.card.locator('internal:role=button[name=/Snooze/i]');
    this.wakeAllButton = this.card.locator('internal:role=button[name=/Resume All|Confirm Resume All/i]');

    this.automationList = this.card.locator('internal:role=listbox[name=/Automations/i]');
    this.pausedList = this.card.locator('internal:role=region[name=/Snoozed/i]');
    this.scheduledList = this.card.locator('internal:role=region[name=/Scheduled/i]');

    this.toast = this.card.locator('internal:role=alert');
    this.undoButton = this.card.locator('internal:role=button[name=/Undo/i]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard-testing/0');
    await this.waitForHassConnection();
    await this.waitForCardReady();
  }

  async waitForCardReady(): Promise<void> {
    // Wait for the autosnooze-card element to appear (may be nested in sections)
    await this.page.waitForFunction(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        if (!card?.shadowRoot) return false;
        const listItems = card.shadowRoot.querySelectorAll('.list-item');
        const emptyMessage = card.shadowRoot.querySelector('.list-empty');
        const header = card.shadowRoot.querySelector('.header');
        return header !== null && (listItems.length > 0 || emptyMessage !== null);
      })()
      `,
      { timeout: 30000 }
    );
  }

  // Wait for a specific number of paused items to appear
  async waitForPausedCount(count: number, timeout: number = DEFAULT_WAIT_TIMEOUT): Promise<void> {
    await this.page.waitForFunction(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.paused-item');
        return (items?.length ?? 0) === ${count};
      })()
      `,
      { timeout }
    );
  }

  // Wait for a specific number of scheduled items to appear
  async waitForScheduledCount(count: number, timeout: number = DEFAULT_WAIT_TIMEOUT): Promise<void> {
    await this.page.waitForFunction(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.scheduled-item');
        return (items?.length ?? 0) === ${count};
      })()
      `,
      { timeout }
    );
  }

  // Wait for toast to appear
  async waitForToast(timeout: number = DEFAULT_WAIT_TIMEOUT): Promise<void> {
    await this.page.waitForFunction(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.toast') !== null;
      })()
      `,
      { timeout }
    );
  }

  // Wait for toast to disappear
  async waitForToastGone(timeout: number = DEFAULT_WAIT_TIMEOUT): Promise<void> {
    await this.page.waitForFunction(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.toast') === null;
      })()
      `,
      { timeout }
    );
  }

  // Wait for a specific automation to appear in the paused list
  async waitForPausedAutomation(name: string, timeout: number = DEFAULT_WAIT_TIMEOUT): Promise<void> {
    const escapedName = name.replace(/'/g, "\\'");
    await this.page.waitForFunction(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.paused-item');
        for (const item of items || []) {
          if (item.textContent?.includes('${escapedName}')) {
            return true;
          }
        }
        return false;
      })()
      `,
      { timeout }
    );
  }

  // Wait for a specific automation to disappear from the paused list
  async waitForPausedAutomationGone(name: string, timeout: number = DEFAULT_WAIT_TIMEOUT): Promise<void> {
    const escapedName = name.replace(/'/g, "\\'");
    await this.page.waitForFunction(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.paused-item');
        for (const item of items || []) {
          if (item.textContent?.includes('${escapedName}')) {
            return false;
          }
        }
        return true;
      })()
      `,
      { timeout }
    );
  }

  // Selection methods
  async selectAutomation(name: string): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.list-item');
        items?.forEach((item) => {
          if (item.textContent?.includes('${name.replace(/'/g, "\\'")}')) {
            item.click();
          }
        });
      })()
      `
    );
    await this.page.waitForTimeout(100);
  }

  async selectAutomationByIndex(index: number): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.list-item');
        if (items?.[${index}]) {
          items[${index}].click();
        }
      })()
      `
    );
    await this.page.waitForTimeout(100);
  }

  async isAutomationSelected(name: string): Promise<boolean> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.list-item');
        for (const item of items || []) {
          if (item.textContent?.includes('${name.replace(/'/g, "\\'")}')) {
            return item.classList.contains('selected');
          }
        }
        return false;
      })()
      `
    );
  }

  async selectAll(): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.select-all');
        btn?.click();
      })()
      `
    );
    await this.page.waitForTimeout(100);
  }

  async clearSelection(): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.clear-selection');
        btn?.click();
      })()
      `
    );
    await this.page.waitForTimeout(100);
  }

  async getSelectedCount(): Promise<number> {
    const text = await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        // The status span is inside .selection-actions div
        const status = card?.shadowRoot?.querySelector('.selection-actions [role="status"]');
        return status?.textContent ?? '';
      })()
      `
    );
    const match = String(text).match(/(\d+)\s*of/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // Filter tabs
  async switchToTab(tab: 'all' | 'areas' | 'categories' | 'labels'): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const tabs = card?.shadowRoot?.querySelectorAll('.tab');
        tabs?.forEach((t) => {
          if (t.textContent?.toLowerCase().includes('${tab}')) {
            t.click();
          }
        });
      })()
      `
    );
    await this.page.waitForTimeout(200);
  }

  // Search
  async search(query: string): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const input = card?.shadowRoot?.querySelector('.search-box input');
        if (input) {
          input.value = '${query.replace(/'/g, "\\'")}';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
      `
    );
    // Wait for debounce (350ms in the card)
    await this.page.waitForTimeout(400);
  }

  async clearSearch(): Promise<void> {
    await this.search('');
  }

  // Duration selection
  async selectDuration(label: string): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const pills = card?.shadowRoot?.querySelectorAll('.pill');
        pills?.forEach((pill) => {
          if (pill.textContent?.trim() === '${label}') {
            pill.click();
          }
        });
      })()
      `
    );
    await this.page.waitForTimeout(100);
  }

  async setCustomDuration(duration: string): Promise<void> {
    await this.selectDuration('Custom');
    await this.page.evaluate(
      ({ duration, findCardScript }) => {
        const findAutosnoozeCard = new Function(findCardScript + 'return findAutosnoozeCard();');
        const card = findAutosnoozeCard() as Element | null;
        const input = (card as Element & { shadowRoot?: ShadowRoot })?.shadowRoot?.querySelector(
          '.duration-input'
        ) as HTMLInputElement | null;
        if (input) {
          input.value = duration;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      { duration, findCardScript: findAutosnoozeCard }
    );
    await this.page.waitForTimeout(100);
  }

  async isDurationInputValid(): Promise<boolean> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const input = card?.shadowRoot?.querySelector('.duration-input');
        return !input?.classList.contains('invalid');
      })()
      `
    );
  }

  // Schedule mode
  async switchToScheduleMode(): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const link = card?.shadowRoot?.querySelector('.schedule-link');
        if (link?.textContent?.includes('Pick specific')) {
          link.click();
        }
      })()
      `
    );
    await this.page.waitForTimeout(200);
  }

  async switchToDurationMode(): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const link = card?.shadowRoot?.querySelector('.schedule-link');
        if (link?.textContent?.includes('Back to duration')) {
          link.click();
        }
      })()
      `
    );
    await this.page.waitForTimeout(200);
  }

  async setSchedule(options: {
    disableAt?: { date: string; time: string };
    resumeAt: { date: string; time: string };
  }): Promise<void> {
    const opts = JSON.stringify(options);
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const opts = ${opts};

        if (opts.disableAt) {
          const disableDate = card?.shadowRoot?.querySelector('select[aria-label="Snooze date"]');
          const disableTime = card?.shadowRoot?.querySelector('input[aria-label="Snooze time"]');
          if (disableDate) {
            disableDate.value = opts.disableAt.date;
            disableDate.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (disableTime) {
            disableTime.value = opts.disableAt.time;
            disableTime.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        const resumeDate = card?.shadowRoot?.querySelector('select[aria-label="Resume date"]');
        const resumeTime = card?.shadowRoot?.querySelector('input[aria-label="Resume time"]');
        if (resumeDate) {
          resumeDate.value = opts.resumeAt.date;
          resumeDate.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (resumeTime) {
          resumeTime.value = opts.resumeAt.time;
          resumeTime.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
      `
    );
    await this.page.waitForTimeout(200);
  }

  // Actions
  async snooze(): Promise<void> {
    // Get current paused and scheduled counts before snoozing
    const beforePaused = await this.getPausedCount();
    const beforeScheduled = await this.getScheduledCount();

    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.snooze-btn');
        btn?.click();
      })()
      `
    );

    // Wait for either paused or scheduled count to change
    // The actual count should increase if there were selected automations
    try {
      await this.page.waitForFunction(
        `
        (() => {
          ${findAutosnoozeCard}
          const card = findAutosnoozeCard();
          const pausedItems = card?.shadowRoot?.querySelectorAll('.paused-item');
          const scheduledItems = card?.shadowRoot?.querySelectorAll('.scheduled-item');
          const currentPaused = pausedItems?.length ?? 0;
          const currentScheduled = scheduledItems?.length ?? 0;
          return currentPaused > ${beforePaused} || currentScheduled > ${beforeScheduled};
        })()
        `,
        { timeout: DEFAULT_WAIT_TIMEOUT }
      );
    } catch {
      // Snooze may have failed (e.g., nothing selected, invalid duration)
      // Just wait a bit for any error toast
      await this.page.waitForTimeout(500);
    }
  }

  async wakeAll(): Promise<void> {
    // First click
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.wake-all');
        btn?.click();
      })()
      `
    );
    await this.page.waitForTimeout(100);
    // Second click for confirmation
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.wake-all');
        btn?.click();
      })()
      `
    );
    // Wait for all paused items to be removed
    await this.waitForPausedCount(0);
  }

  async wakeAutomation(name: string): Promise<void> {
    const escapedName = name.replace(/'/g, "\\'");

    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.paused-item');
        items?.forEach((item) => {
          if (item.textContent?.includes('${escapedName}')) {
            const btn = item.querySelector('.wake-btn');
            btn?.click();
          }
        });
      })()
      `
    );
    // Wait for the automation to be removed from paused list
    await this.waitForPausedAutomationGone(name);
  }

  async cancelScheduled(name: string): Promise<void> {
    const beforeCount = await this.getScheduledCount();
    const escapedName = name.replace(/'/g, "\\'");

    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.scheduled-item');
        items?.forEach((item) => {
          if (item.textContent?.includes('${escapedName}')) {
            const btn = item.querySelector('.cancel-scheduled-btn');
            btn?.click();
          }
        });
      })()
      `
    );
    // Wait for scheduled count to decrease
    await this.waitForScheduledCount(beforeCount - 1);
  }

  async undo(): Promise<void> {
    // First wait for toast to be present
    await this.waitForToast();

    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.toast-undo-btn');
        btn?.click();
      })()
      `
    );
    // Wait for toast to update (will show "restored" message)
    await this.page.waitForTimeout(300);
  }

  // Getters
  async getAutomationCount(): Promise<number> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelectorAll('.list-item').length ?? 0;
      })()
      `
    );
  }

  async getPausedCount(): Promise<number> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelectorAll('.paused-item').length ?? 0;
      })()
      `
    );
  }

  async getScheduledCount(): Promise<number> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelectorAll('.scheduled-item').length ?? 0;
      })()
      `
    );
  }

  async getToastMessage(): Promise<string> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const toast = card?.shadowRoot?.querySelector('.toast');
        return toast?.textContent?.trim() ?? '';
      })()
      `
    );
  }

  async isToastVisible(): Promise<boolean> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.toast') !== null;
      })()
      `
    );
  }

  async getCountdown(name: string): Promise<string> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const items = card?.shadowRoot?.querySelectorAll('.paused-item');
        for (const item of items || []) {
          if (item.textContent?.includes('${name.replace(/'/g, "\\'")}')) {
            const group = item.closest('.pause-group');
            const countdown = group?.querySelector('.countdown');
            return countdown?.textContent?.trim() ?? '';
          }
        }
        return '';
      })()
      `
    );
  }

  async isSnoozeButtonEnabled(): Promise<boolean> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const btn = card?.shadowRoot?.querySelector('.snooze-btn');
        return btn && !btn.disabled;
      })()
      `
    );
  }

  async getGroupCount(): Promise<number> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelectorAll('.group-header').length ?? 0;
      })()
      `
    );
  }

  async expandGroup(groupName: string): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const headers = card?.shadowRoot?.querySelectorAll('.group-header');
        headers?.forEach((header) => {
          if (header.textContent?.includes('${groupName.replace(/'/g, "\\'")}') && !header.classList.contains('expanded')) {
            header.click();
          }
        });
      })()
      `
    );
    await this.page.waitForTimeout(200);
  }

  async collapseGroup(groupName: string): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const headers = card?.shadowRoot?.querySelectorAll('.group-header');
        headers?.forEach((header) => {
          if (header.textContent?.includes('${groupName.replace(/'/g, "\\'")}') && header.classList.contains('expanded')) {
            header.click();
          }
        });
      })()
      `
    );
    await this.page.waitForTimeout(200);
  }

  async selectGroupCheckbox(groupName: string): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const headers = card?.shadowRoot?.querySelectorAll('.group-header');
        headers?.forEach((header) => {
          if (header.textContent?.includes('${groupName.replace(/'/g, "\\'")}')) {
            const checkbox = header.querySelector('input[type="checkbox"]');
            checkbox?.click();
          }
        });
      })()
      `
    );
    await this.page.waitForTimeout(100);
  }

  async getActiveTab(): Promise<string> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const activeTab = card?.shadowRoot?.querySelector('.tab.active');
        return activeTab?.textContent?.trim().split(/\\s+/)[0].toLowerCase() ?? '';
      })()
      `
    );
  }

  async getActiveDurationPill(): Promise<string> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const activePill = card?.shadowRoot?.querySelector('.pill.active');
        return activePill?.textContent?.trim() ?? '';
      })()
      `
    );
  }

  async getHeaderText(): Promise<string> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        return card?.shadowRoot?.querySelector('.header')?.textContent ?? '';
      })()
      `
    );
  }

  // Assertion helpers
  async expectAutomationCount(count: number): Promise<void> {
    const actual = await this.getAutomationCount();
    expect(actual).toBe(count);
  }

  async expectPausedCount(count: number): Promise<void> {
    // Use the wait method for robust checking
    try {
      await this.waitForPausedCount(count, 5000);
    } catch {
      // If timeout, get actual count for better error message
      const actual = await this.getPausedCount();
      expect(actual).toBe(count);
    }
  }

  async expectScheduledCount(count: number): Promise<void> {
    try {
      await this.waitForScheduledCount(count, 5000);
    } catch {
      const actual = await this.getScheduledCount();
      expect(actual).toBe(count);
    }
  }

  async expectToastMessage(substring: string): Promise<void> {
    // Wait for toast to appear first
    try {
      await this.waitForToast(5000);
    } catch {
      // Toast didn't appear
    }
    const message = await this.getToastMessage();
    expect(message.toLowerCase()).toContain(substring.toLowerCase());
  }

  async expectSnoozeButtonDisabled(): Promise<void> {
    const enabled = await this.isSnoozeButtonEnabled();
    expect(enabled).toBe(false);
  }

  async expectSnoozeButtonEnabled(): Promise<void> {
    const enabled = await this.isSnoozeButtonEnabled();
    expect(enabled).toBe(true);
  }

  // Last Duration Badge methods
  /**
   * Check if the "Last Duration" badge is visible
   */
  async isLastDurationBadgeVisible(): Promise<boolean> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const badge = card?.shadowRoot?.querySelector('.last-duration-badge');
        return badge !== null && getComputedStyle(badge).display !== 'none';
      })()
      `
    );
  }

  /**
   * Get the last duration badge text (e.g., "2h30m")
   */
  async getLastDurationBadgeText(): Promise<string> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const badge = card?.shadowRoot?.querySelector('.last-duration-badge');
        return badge?.textContent?.trim() ?? '';
      })()
      `
    );
  }

  /**
   * Click the last duration badge
   */
  async clickLastDurationBadge(): Promise<void> {
    await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const badge = card?.shadowRoot?.querySelector('.last-duration-badge');
        badge?.click();
      })()
      `
    );
    await this.page.waitForTimeout(100);
  }

  /**
   * Wait for the last duration badge to appear
   */
  async waitForLastDurationBadge(timeout: number = DEFAULT_WAIT_TIMEOUT): Promise<void> {
    await this.page.waitForFunction(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const badge = card?.shadowRoot?.querySelector('.last-duration-badge');
        return badge !== null && getComputedStyle(badge).display !== 'none';
      })()
      `,
      { timeout }
    );
  }

  /**
   * Wait for the last duration badge to disappear
   */
  async waitForLastDurationBadgeGone(timeout: number = DEFAULT_WAIT_TIMEOUT): Promise<void> {
    await this.page.waitForFunction(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const badge = card?.shadowRoot?.querySelector('.last-duration-badge');
        return badge === null || getComputedStyle(badge).display === 'none';
      })()
      `,
      { timeout }
    );
  }

  /**
   * Get the duration pills (for verification)
   */
  async getDurationPills(): Promise<Array<{ textContent: string; active: boolean }>> {
    return await this.page.evaluate(
      `
      (() => {
        ${findAutosnoozeCard}
        const card = findAutosnoozeCard();
        const pills = card?.shadowRoot?.querySelectorAll('.pill');
        return Array.from(pills || []).map(pill => ({
          textContent: pill.textContent?.trim() ?? '',
          active: pill.classList.contains('active')
        }));
      })()
      `
    );
  }
}
