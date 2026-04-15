import { describe, expect, test } from 'vitest';
import { AutoSnoozeAutomationList } from '../components/autosnooze-automation-list.js';
import type { AutomationItem } from '../types/automation.js';
import type { HomeAssistant } from '../types/hass.js';

const TEST_TAG = 'test-recent-automation-list';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, AutoSnoozeAutomationList);
}

type TestList = AutoSnoozeAutomationList & {
  recentSnoozeIds: string[];
  _filterTab: string;
  _search: string;
  _getFilteredAutomations: () => AutomationItem[];
};

describe('Recently snoozed pinned group', () => {
  test('renders recent group header and items at top of All tab', async () => {
    const el = document.createElement(TEST_TAG) as unknown as TestList;
    el.hass = {
      states: {},
      entities: {},
      areas: {},
      connection: { sendMessagePromise: async () => [] },
      callService: async () => undefined,
    } as unknown as HomeAssistant;
    el.automations = [
      { id: 'automation.a', name: 'Alpha', area_id: null, category_id: null, labels: [] },
      { id: 'automation.b', name: 'Bravo', area_id: null, category_id: null, labels: [] },
      { id: 'automation.c', name: 'Charlie', area_id: null, category_id: null, labels: [] },
    ];
    el.selected = [];
    el.labelRegistry = {};
    el.categoryRegistry = {};
    el.recentSnoozeIds = ['automation.b'];
    el._filterTab = 'all';
    el._search = '';

    document.body.appendChild(el);
    try {
      await el.updateComplete;

      const items = el.shadowRoot!.querySelectorAll('.list-item');
      const recentHeader = el.shadowRoot!.querySelector('.recent-group-header');

      expect(recentHeader).not.toBeNull();
      // Recent item (Bravo) should appear before non-recent items
      const names = Array.from(items).map((item) =>
        item.querySelector('.list-item-name')?.textContent?.trim()
      );
      expect(names[0]).toBe('Bravo');
    } finally {
      document.body.removeChild(el);
    }
  });

  test('hides recent header when filtered results contain no recent automations', async () => {
    const el = document.createElement(TEST_TAG) as unknown as TestList;
    el.hass = {
      states: {},
      entities: {},
      areas: {},
      connection: { sendMessagePromise: async () => [] },
      callService: async () => undefined,
    } as unknown as HomeAssistant;
    el.automations = [
      { id: 'automation.a', name: 'Alpha', area_id: null, category_id: null, labels: [] },
      { id: 'automation.b', name: 'Bravo', area_id: null, category_id: null, labels: [] },
      { id: 'automation.c', name: 'Charlie', area_id: null, category_id: null, labels: [] },
    ];
    el.selected = [];
    el.labelRegistry = {};
    el.categoryRegistry = {};
    el.recentSnoozeIds = ['automation.b'];
    el._filterTab = 'all';
    el._search = 'charlie';

    document.body.appendChild(el);
    try {
      await el.updateComplete;

      const recentHeader = el.shadowRoot!.querySelector('.recent-group-header');
      const names = Array.from(el.shadowRoot!.querySelectorAll('.list-item-name'))
        .map((item) => item.textContent?.trim());

      expect(recentHeader).toBeNull();
      expect(names).toEqual(['Charlie']);
    } finally {
      document.body.removeChild(el);
    }
  });
});
