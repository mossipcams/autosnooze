import { describe, expect, test } from 'vitest';
import { AutoSnoozeAutomationList } from '../components/autosnooze-automation-list.js';
import { automationListStyles } from '../styles/automation-list.styles.js';
import type { HomeAssistant } from '../types/hass.js';

const TEST_TAG = 'test-recent-polish-automation-list';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, AutoSnoozeAutomationList);
}

type TestList = AutoSnoozeAutomationList & {
  recentSnoozeIds: string[];
  _filterTab: string;
  _search: string;
};

function buildListWithRecents(): TestList {
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
  return el;
}

describe('Recent group polish', () => {
  test('recent group header contains a history ha-icon and label text', async () => {
    const el = buildListWithRecents();
    document.body.appendChild(el);
    try {
      await el.updateComplete;

      const header = el.shadowRoot!.querySelector('.recent-group-header');
      expect(header).not.toBeNull();

      const icon = header!.querySelector('ha-icon');
      expect(icon).not.toBeNull();
      expect(icon!.getAttribute('icon')).toBe('mdi:history');

      const label = header!.querySelector('span');
      expect(label?.textContent?.trim()).toBe('Recent');
    } finally {
      document.body.removeChild(el);
    }
  });

  test('recent list items receive the is-recent class, others do not', async () => {
    const el = buildListWithRecents();
    document.body.appendChild(el);
    try {
      await el.updateComplete;

      const items = Array.from(el.shadowRoot!.querySelectorAll('.list-item')) as HTMLElement[];
      const recent = items.filter((i) => i.classList.contains('is-recent'));
      const nonRecent = items.filter((i) => !i.classList.contains('is-recent'));

      expect(recent).toHaveLength(1);
      expect(recent[0]?.querySelector('.list-item-name')?.textContent?.trim()).toBe('Bravo');
      expect(nonRecent).toHaveLength(2);
    } finally {
      document.body.removeChild(el);
    }
  });

  test('recent-group-header uses flex layout with gap for icon + label', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.recent-group-header\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toContain('display: flex');
    expect(block).toContain('align-items: center');
    expect(block).toMatch(/gap:\s*\d+px/);
  });

  test('recent-group-header has a subtle primary-tinted background', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.recent-group-header\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toMatch(/background:\s*color-mix\([^)]*--primary-color[^)]*\)/);
  });

  test('recent-group-header ha-icon is sized and colored with primary color', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.recent-group-header ha-icon\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toMatch(/--mdc-icon-size:\s*\d+px/);
    expect(block).toContain('var(--primary-color)');
  });

  test('recent list items get a subtle primary-tinted background via is-recent selector', () => {
    const cssText = automationListStyles.cssText;
    expect(cssText).toMatch(/\.list-item\.is-recent[^{]*\{[^}]*background:\s*color-mix\([^)]*--primary-color[^)]*\)/);
  });
});
