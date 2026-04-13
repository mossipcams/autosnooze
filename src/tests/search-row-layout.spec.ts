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
    expect(searchRow!.querySelector('.selection-actions')).toBeNull();

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
    const directChildren = Array.from(searchRow?.children ?? []).map((child) => child.className);

    expect(searchRow).not.toBeNull();
    expect(status).not.toBeNull();
    expect(status?.classList.contains('selection-count')).toBe(true);
    expect(status?.textContent).toContain('1');
    expect(status?.textContent).toContain('2');
    expect(directChildren).toContain('search-box');
    expect(directChildren).toContain('selection-count');
    expect(searchRow!.querySelector('.select-all-btn')).not.toBeNull();
    expect(searchRow!.querySelector('.clear-selection-btn')).not.toBeNull();

    document.body.removeChild(el);
  });

  test('mobile styles keep the full search row on one line', () => {
    const cssText = automationListStyles.cssText;

    expect(cssText).toContain('@media (max-width: 480px)');
    expect(cssText).toContain('.search-row');
    expect(cssText).toContain('.search-box');
    expect(cssText).toContain('flex-wrap: nowrap');
    expect(cssText).toContain('flex: 1 1 0');
    expect(cssText).not.toContain('min-width: max-content');
  });

  test('desktop styles keep the search field visually compact', () => {
    const cssText = automationListStyles.cssText;

    expect(cssText).toContain('.search-box');
    expect(cssText).toContain('flex: 1 1 0');
    expect(cssText).toContain('.search-box input');
    expect(cssText).toContain('padding: 8px 72px 8px 12px');
    expect(cssText).toContain('min-height: 40px');
  });

  test('search row styles keep the selected count as inline helper text', () => {
    const cssText = automationListStyles.cssText;

    expect(cssText).toContain('.search-row');
    expect(cssText).toContain('align-items: center');
    expect(cssText).toContain('row-gap: 8px');
    expect(cssText).toContain('.selection-count');
    expect(cssText).toContain('margin-left: auto');
    expect(cssText).toContain('padding: 0');
    expect(cssText).toContain('background: transparent');
    expect(cssText).toContain('font-size: 0.84em');
    expect(cssText).toContain('.select-all-btn');
    expect(cssText).toContain('min-height: 28px');
  });

  test('search clear button uses a search-specific aria-label, not the selection clear label', async () => {
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

    // Type into search to make the clear button appear
    const input = el.shadowRoot!.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;

    const clearBtn = el.shadowRoot!.querySelector('.search-clear-btn');
    expect(clearBtn).not.toBeNull();
    expect(clearBtn!.getAttribute('aria-label')).toBe('Clear search');

    document.body.removeChild(el);
  });

  test('search box uses fluid max-width instead of fixed 240px', () => {
    const cssText = automationListStyles.cssText;
    const searchBoxMatch = cssText.match(/\.search-box\s*\{[^}]*\}/);
    expect(searchBoxMatch).not.toBeNull();
    const block = searchBoxMatch![0];
    expect(block).not.toContain('max-width: 240px');
  });

  test('search row has a subtle background and padding to read as a cohesive toolbar', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.search-row\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toMatch(/background:/);
    expect(block).toMatch(/padding:\s*\d+px/);
    expect(block).toMatch(/border-radius:/);
  });

  test('select-all button has a primary-tinted border for visual hierarchy', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.select-all-btn\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toMatch(/border:.*var\(--primary-color\)/);
  });

  test('search row widths prioritize keeping select-all inline', () => {
    const cssText = automationListStyles.cssText;

    expect(cssText).toContain('flex-wrap: nowrap');
    expect(cssText).toContain('margin-left: auto');
    expect(cssText).toContain('min-width: 0');
  });
});
