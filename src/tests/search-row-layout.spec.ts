import { describe, expect, test } from 'vitest';
import { AutoSnoozeAutomationList } from '../components/autosnooze-automation-list.js';
import { automationListStyles } from '../styles/automation-list.styles.js';
import type { HomeAssistant } from '../types/hass.js';

const TEST_TAG = 'test-search-row';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, AutoSnoozeAutomationList);
}

describe('Search and selection actions on same row', () => {
  test('search input and select-all button share a .search-row parent', async () => {
    const el = document.createElement(TEST_TAG) as unknown as AutoSnoozeAutomationList;
    el.hass = {
      states: {},
      entities: {},
      areas: {},
      connection: { sendMessagePromise: async () => [] },
      callService: async () => undefined,
    } as unknown as HomeAssistant;
    el.automations = [
      { id: 'automation.a', name: 'Alpha', area_id: null, category_id: null, labels: [] },
    ];
    el.selected = [];
    el.labelRegistry = {};
    el.categoryRegistry = {};

    document.body.appendChild(el);
    await el.updateComplete;

    const searchRow = el.shadowRoot!.querySelector('.search-row');
    expect(searchRow).not.toBeNull();
    expect(searchRow!.querySelector('input[type="search"]')).not.toBeNull();
    expect(searchRow!.querySelector('[role="status"]')).not.toBeNull();
    expect(searchRow!.querySelector('.select-all-btn')).not.toBeNull();

    document.body.removeChild(el);
  });

  test('selected-count status stays in the shared row when items are selected', async () => {
    const el = document.createElement(TEST_TAG) as unknown as AutoSnoozeAutomationList;
    el.hass = {
      states: {},
      entities: {},
      areas: {},
      connection: { sendMessagePromise: async () => [] },
      callService: async () => undefined,
    } as unknown as HomeAssistant;
    el.automations = [
      { id: 'automation.a', name: 'Alpha', area_id: null, category_id: null, labels: [] },
      { id: 'automation.b', name: 'Beta', area_id: null, category_id: null, labels: [] },
    ];
    el.selected = ['automation.a'];
    el.labelRegistry = {};
    el.categoryRegistry = {};

    document.body.appendChild(el);
    await el.updateComplete;

    const searchRow = el.shadowRoot!.querySelector('.search-row');
    const status = searchRow?.querySelector('[role="status"]');

    expect(searchRow).not.toBeNull();
    expect(status).not.toBeNull();
    expect(status?.textContent).toContain('1');
    expect(status?.textContent).toContain('2');
    expect(searchRow!.querySelector('.clear-selection-btn')).not.toBeNull();

    document.body.removeChild(el);
  });

  test('mobile styles allow the search row to wrap when actions need more space', () => {
    const cssText = automationListStyles.cssText;

    expect(cssText).toContain('@media (max-width: 480px)');
    expect(cssText).toContain('.search-row');
    expect(cssText).not.toContain('flex-wrap: nowrap');
    expect(cssText).toContain('.search-box');
    expect(cssText).toContain('flex: 1 1 100%');
    expect(cssText).toContain('width: 100%');
    expect(cssText).not.toContain('min-width: max-content');
  });
});
