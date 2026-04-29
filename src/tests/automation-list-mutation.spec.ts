import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { AutoSnoozeAutomationList } from '../components/autosnooze-automation-list.js';
import type { AutomationItem } from '../types/automation.js';
import type { HassCategory, HassLabel, HomeAssistant } from '../types/hass.js';

const hapticMock = vi.hoisted(() => vi.fn());

vi.mock('../utils/haptic.js', () => ({ hapticFeedback: hapticMock }));

const automationListModule = await import('../components/autosnooze-automation-list.js');

if (!customElements.get('autosnooze-automation-list-mutation')) {
  customElements.define('autosnooze-automation-list-mutation', automationListModule.AutoSnoozeAutomationList);
}

const AUTOMATIONS: AutomationItem[] = [
  {
    id: 'automation.kitchen_lights',
    name: 'Kitchen Lights',
    area_id: 'kitchen',
    category_id: 'lighting',
    labels: ['evening'],
  },
  {
    id: 'automation.office_fan',
    name: 'Office Fan',
    area_id: 'office',
    category_id: 'climate',
    labels: [],
  },
  {
    id: 'automation.porch',
    name: 'Porch',
    area_id: null,
    category_id: null,
    labels: ['evening'],
  },
];

const HASS = {
  locale: { language: 'en-US' },
  areas: {
    kitchen: { name: 'Kitchen' },
    office: { name: 'Office' },
  },
} as unknown as HomeAssistant;

const LABELS: Record<string, HassLabel> = {
  evening: { label_id: 'evening', name: 'Evening' },
};

const CATEGORIES: Record<string, HassCategory> = {
  lighting: { category_id: 'lighting', name: 'Lighting' },
  climate: { category_id: 'climate', name: 'Climate' },
};

function createList(): AutoSnoozeAutomationList {
  return document.createElement('autosnooze-automation-list-mutation') as AutoSnoozeAutomationList;
}

async function connectList(
  setup: (element: AutoSnoozeAutomationList) => void = () => {}
): Promise<AutoSnoozeAutomationList> {
  const element = createList();
  element.hass = HASS;
  element.automations = AUTOMATIONS;
  element.labelRegistry = LABELS;
  element.categoryRegistry = CATEGORIES;
  setup(element);
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
}

function getText(element: Element | null): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function tabButtons(element: AutoSnoozeAutomationList): HTMLButtonElement[] {
  return Array.from(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tab') ?? []);
}

function lastEvent(events: CustomEvent[]): CustomEvent | undefined {
  return events[events.length - 1];
}

describe('automation list mutation boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    hapticMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('renders exact tab state, counts, search affordances, and listbox metadata', async () => {
    const element = await connectList((el) => {
      el.selected = ['automation.office_fan'];
      el.recentSnoozeIds = ['automation.porch'];
    });

    const tabs = tabButtons(element);
    expect(element.shadowRoot?.querySelector('.filter-tabs')?.getAttribute('aria-label')).toBe('Filter automations by');
    expect(tabs.map(getText)).toEqual(['All 3', 'Areas 2', 'Categories 2', 'Labels 1']);
    expect(tabs.map((tab) => tab.classList.contains('active'))).toEqual([true, false, false, false]);
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false']);
    expect(tabs[0]?.querySelector('.tab-count')?.getAttribute('aria-label')).toBe('3 automations');
    expect(tabs[1]?.querySelector('.tab-count')?.getAttribute('aria-label')).toBe('2 areas');
    expect(tabs[2]?.querySelector('.tab-count')?.getAttribute('aria-label')).toBe('2 categories');
    expect(tabs[3]?.querySelector('.tab-count')?.getAttribute('aria-label')).toBe('1 labels');

    const search = element.shadowRoot?.querySelector<HTMLInputElement>('.search-box input');
    expect(search?.placeholder).toBe('Search automations...');
    expect(search?.getAttribute('aria-label')).toBe('Search automations by name');
    expect(element.shadowRoot?.querySelector('.search-clear-btn')).toBeNull();

    expect(getText(element.shadowRoot?.querySelector('.selection-count'))).toBe('1 of 3 selected');
    expect(getText(element.shadowRoot?.querySelector('.select-all-btn:not(.clear-selection-btn)'))).toBe('Select All');
    expect(element.shadowRoot?.querySelector('.select-all-btn:not(.clear-selection-btn)')?.getAttribute('aria-label')).toBe(
      'Select all visible automations'
    );
    expect(getText(element.shadowRoot?.querySelector('.clear-selection-btn'))).toBe('Clear');
    expect(element.shadowRoot?.querySelector('.clear-selection-btn')?.getAttribute('aria-label')).toBe('Clear selection');

    const listbox = element.shadowRoot?.querySelector('.selection-list');
    expect(listbox?.getAttribute('role')).toBe('listbox');
    expect(listbox?.getAttribute('aria-label')).toBe('Automations list');
    expect(listbox?.getAttribute('aria-multiselectable')).toBe('true');
    expect(element.shadowRoot?.textContent).not.toContain('Stryker was here!');
  });

  test('pins recent automations first and preserves exact option labels and selection attributes', async () => {
    const element = await connectList((el) => {
      el.selected = ['automation.porch'];
      el.recentSnoozeIds = ['automation.porch'];
    });

    expect(getText(element.shadowRoot?.querySelector('.recent-group-header'))).toBe('Recent');

    const items = Array.from(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.list-item') ?? []);
    expect(items.map((item) => getText(item.querySelector('.list-item-name')))).toEqual([
      'Porch',
      'Kitchen Lights',
      'Office Fan',
    ]);
    expect(items.map((item) => item.classList.contains('is-recent'))).toEqual([true, false, false]);
    expect(items.map((item) => item.classList.contains('selected'))).toEqual([true, false, false]);
    expect(items.map((item) => item.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(items[0]?.querySelector('input')?.getAttribute('aria-label')).toBe('Select Porch');
  });

  test('dispatches exact selection payloads from row, checkbox, select-all, and clear buttons', async () => {
    const element = await connectList((el) => {
      el.selected = ['automation.office_fan'];
    });
    const events: CustomEvent[] = [];
    element.addEventListener('selection-change', (event) => events.push(event as CustomEvent));

    element.shadowRoot?.querySelector<HTMLButtonElement>('.list-item')?.click();
    expect(hapticMock).toHaveBeenCalledWith('selection');
    expect(lastEvent(events)?.detail).toEqual({
      selected: ['automation.office_fan', 'automation.kitchen_lights'],
    });
    expect(lastEvent(events)?.bubbles).toBe(true);
    expect(lastEvent(events)?.composed).toBe(true);

    const checkbox = element.shadowRoot?.querySelector<HTMLInputElement>('.list-item input');
    const click = new MouseEvent('click', { bubbles: true });
    const stopPropagation = vi.fn();
    Object.defineProperty(click, 'stopPropagation', { value: stopPropagation });
    checkbox?.dispatchEvent(click);
    expect(stopPropagation).toHaveBeenCalledTimes(1);

    events.length = 0;
    checkbox?.dispatchEvent(new Event('change', { bubbles: true }));
    expect(lastEvent(events)?.detail).toEqual({
      selected: ['automation.office_fan', 'automation.kitchen_lights'],
    });

    element.shadowRoot?.querySelector<HTMLButtonElement>('.select-all-btn:not(.clear-selection-btn)')?.click();
    expect(lastEvent(events)?.detail).toEqual({
      selected: ['automation.office_fan', 'automation.kitchen_lights', 'automation.porch'],
    });

    element.shadowRoot?.querySelector<HTMLButtonElement>('.clear-selection-btn')?.click();
    expect(lastEvent(events)?.detail).toEqual({ selected: [] });
  });

  test('hides select-all when every visible item is already selected and keeps clear hidden when none are selected', async () => {
    const allSelected = await connectList((el) => {
      el.selected = ['automation.kitchen_lights', 'automation.office_fan', 'automation.porch'];
    });
    expect(allSelected.shadowRoot?.querySelector('.select-all-btn:not(.clear-selection-btn)')).toBeNull();
    expect(getText(allSelected.shadowRoot?.querySelector('.clear-selection-btn'))).toBe('Clear');
    expect(allSelected.shadowRoot?.textContent).not.toContain('Stryker was here!');

    const noneSelected = await connectList();
    expect(noneSelected.shadowRoot?.querySelector('.clear-selection-btn')).toBeNull();
    expect(getText(noneSelected.shadowRoot?.querySelector('.select-all-btn:not(.clear-selection-btn)'))).toBe(
      'Select All'
    );
    expect(noneSelected.shadowRoot?.textContent).not.toContain('Stryker was here!');
  });

  test('search input debounces, shows a dedicated clear button, and Escape clears only when needed', async () => {
    const element = await connectList();
    const input = element.shadowRoot?.querySelector<HTMLInputElement>('.search-box input');

    input!.value = 'kit';
    input?.dispatchEvent(new Event('input', { bubbles: true }));
    expect((element as never as { _searchInput: string })._searchInput).toBe('kit');
    expect((element as never as { _search: string })._search).toBe('');
    expect((element as never as { _searchTimeout: number | null })._searchTimeout).not.toBeNull();

    vi.advanceTimersByTime(299);
    expect((element as never as { _search: string })._search).toBe('');
    vi.advanceTimersByTime(1);
    await element.updateComplete;
    expect((element as never as { _search: string })._search).toBe('kit');
    expect((element as never as { _searchTimeout: number | null })._searchTimeout).toBeNull();
    expect(getText(element.shadowRoot?.querySelector('.search-clear-btn'))).toBe('Clear');
    expect(element.shadowRoot?.querySelector('.search-clear-btn')?.getAttribute('aria-label')).toBe('Clear search');
    expect(getText(element.shadowRoot?.querySelector('.list-item-name'))).toBe('Kitchen Lights');

    const ignoredEscape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    const ignoredPreventDefault = vi.fn();
    Object.defineProperty(ignoredEscape, 'preventDefault', { value: ignoredPreventDefault });
    (element as never as { _searchInput: string; _search: string })._searchInput = '';
    (element as never as { _searchInput: string; _search: string })._search = '';
    input?.dispatchEvent(ignoredEscape);
    expect(ignoredPreventDefault).not.toHaveBeenCalled();

    (element as never as { _searchInput: string; _search: string })._searchInput = 'office';
    (element as never as { _searchInput: string; _search: string })._search = 'office';
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    const preventDefault = vi.fn();
    Object.defineProperty(escape, 'preventDefault', { value: preventDefault });
    input?.dispatchEvent(escape);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect((element as never as { _searchInput: string; _search: string })._searchInput).toBe('');
    expect((element as never as { _searchInput: string; _search: string })._search).toBe('');
  });

  test('clear search cancels pending debounce and empty filtered views omit selection actions', async () => {
    const element = await connectList();
    const input = element.shadowRoot?.querySelector<HTMLInputElement>('.search-box input');

    input!.value = 'missing';
    input?.dispatchEvent(new Event('input', { bubbles: true }));
    await element.updateComplete;
    element.shadowRoot?.querySelector<HTMLButtonElement>('.search-clear-btn')?.click();

    expect((element as never as { _searchInput: string; _search: string; _searchTimeout: number | null })._searchInput).toBe('');
    expect((element as never as { _searchInput: string; _search: string; _searchTimeout: number | null })._search).toBe('');
    expect((element as never as { _searchInput: string; _search: string; _searchTimeout: number | null })._searchTimeout).toBeNull();

    (element as never as { _search: string; _searchInput: string })._search = 'nothing';
    (element as never as { _search: string; _searchInput: string })._searchInput = 'nothing';
    await element.updateComplete;

    expect(getText(element.shadowRoot?.querySelector('.list-empty'))).toBe('No automations found');
    expect(element.shadowRoot?.querySelector('.selection-count')).toBeNull();
    expect(element.shadowRoot?.querySelector('.select-all-btn')).toBeNull();
  });

  test('grouped tabs expose active state, group metadata, expansion state, and grouped selection', async () => {
    const element = await connectList((el) => {
      el.selected = ['automation.kitchen_lights'];
    });
    const events: CustomEvent[] = [];
    element.addEventListener('selection-change', (event) => events.push(event as CustomEvent));

    tabButtons(element)[1]?.click();
    await element.updateComplete;

    const tabs = tabButtons(element);
    expect(tabs.map((tab) => tab.classList.contains('active'))).toEqual([false, true, false, false]);
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false']);

    const groupHeaders = Array.from(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.group-header') ?? []);
    expect(groupHeaders.map((header) => getText(header.querySelector('span')))).toEqual([
      'Kitchen',
      'Office',
      'Unassigned',
    ]);
    expect(groupHeaders[0]?.classList.contains('expanded')).toBe(true);
    expect(groupHeaders[0]?.getAttribute('aria-expanded')).toBe('true');
    expect(groupHeaders[0]?.getAttribute('aria-label')).toBe('Kitchen group, 1 automations');
    expect(groupHeaders[0]?.querySelector('.group-badge')?.getAttribute('aria-label')).toBe('1 automations');

    groupHeaders[0]?.click();
    await element.updateComplete;
    await Promise.resolve();
    await element.updateComplete;
    expect((element as never as { _expandedGroups: Record<string, boolean> })._expandedGroups.Kitchen).toBe(false);
    expect(element.shadowRoot?.querySelector<HTMLButtonElement>('.group-header')?.classList.contains('expanded')).toBe(false);
    expect(element.shadowRoot?.querySelector<HTMLButtonElement>('.group-header')?.getAttribute('aria-expanded')).toBe('false');
    expect(element.shadowRoot?.querySelector('.list-item-name')?.textContent).not.toBe('Kitchen Lights');

    (element as never as { _selectGroup: (items: AutomationItem[]) => void })._selectGroup([
      AUTOMATIONS[0]!,
      AUTOMATIONS[2]!,
    ]);
    expect(lastEvent(events)?.detail).toEqual({
      selected: ['automation.kitchen_lights', 'automation.porch'],
    });

    element.selected = ['automation.kitchen_lights', 'automation.porch'];
    (element as never as { _selectGroup: (items: AutomationItem[]) => void })._selectGroup([
      AUTOMATIONS[0]!,
      AUTOMATIONS[2]!,
    ]);
    expect(lastEvent(events)?.detail).toEqual({ selected: [] });
  });

  test('category and label tabs keep their own active and aria-selected state', async () => {
    const element = await connectList();

    tabButtons(element)[2]?.click();
    await element.updateComplete;
    expect(tabButtons(element).map((tab) => tab.classList.contains('active'))).toEqual([
      false,
      false,
      true,
      false,
    ]);
    expect(tabButtons(element).map((tab) => tab.getAttribute('aria-selected'))).toEqual([
      'false',
      'false',
      'true',
      'false',
    ]);
    expect(getText(element.shadowRoot?.querySelector('.group-header span'))).toBe('Climate');

    tabButtons(element)[3]?.click();
    await element.updateComplete;
    expect(tabButtons(element).map((tab) => tab.classList.contains('active'))).toEqual([
      false,
      false,
      false,
      true,
    ]);
    expect(tabButtons(element).map((tab) => tab.getAttribute('aria-selected'))).toEqual([
      'false',
      'false',
      'false',
      'true',
    ]);
    expect(getText(element.shadowRoot?.querySelector('.group-header span'))).toBe('Evening');
  });

  test('registry warning text appears only when unavailable flag is set', async () => {
    const normal = await connectList();
    expect(normal.shadowRoot?.querySelector('.registry-warning')).toBeNull();
    expect(normal.shadowRoot?.textContent).not.toContain('Stryker was here!');

    const unavailable = await connectList((el) => {
      el.labelRegistryUnavailable = true;
    });
    const warning = unavailable.shadowRoot?.querySelector('.registry-warning');
    expect(warning?.getAttribute('role')).toBe('status');
    expect(getText(warning)).toBe(
      'Label metadata is temporarily unavailable. Showing automations without label-based filtering.'
    );
  });

  test('view model cache reuses matching inputs and invalidates each tracked dependency', () => {
    const element = createList();
    element.hass = HASS;
    element.automations = AUTOMATIONS;
    element.labelRegistry = LABELS;
    element.categoryRegistry = CATEGORIES;

    const first = (element as never as { _getViewModel: () => unknown })._getViewModel();
    expect((element as never as { _getViewModel: () => unknown })._getViewModel()).toBe(first);

    (element as never as { _search: string })._search = 'kitchen';
    const searchChanged = (element as never as { _getViewModel: () => unknown })._getViewModel();
    expect(searchChanged).not.toBe(first);
    expect((element as never as { _getViewModel: () => unknown })._getViewModel()).toBe(searchChanged);

    (element as never as { _filterTab: string })._filterTab = 'areas';
    const tabChanged = (element as never as { _getViewModel: () => unknown })._getViewModel();
    expect(tabChanged).not.toBe(searchChanged);

    element.hass = { ...HASS } as HomeAssistant;
    const hassChanged = (element as never as { _getViewModel: () => unknown })._getViewModel();
    expect(hassChanged).not.toBe(tabChanged);

    element.labelRegistry = { ...LABELS };
    const labelsChanged = (element as never as { _getViewModel: () => unknown })._getViewModel();
    expect(labelsChanged).not.toBe(hassChanged);

    element.categoryRegistry = { ...CATEGORIES };
    const categoriesChanged = (element as never as { _getViewModel: () => unknown })._getViewModel();
    expect(categoriesChanged).not.toBe(labelsChanged);

    element.automations = [...AUTOMATIONS];
    const automationsChanged = (element as never as { _getViewModel: () => unknown })._getViewModel();
    expect(automationsChanged).not.toBe(categoriesChanged);
  });

  test('name helpers and teardown cover nullish fallback paths', () => {
    const element = createList();
    expect((element as never as { _getAreaName: (areaId: string | null) => string })._getAreaName(null)).toBe(
      'Unassigned'
    );
    element.hass = HASS;
    element.labelRegistry = LABELS;
    element.categoryRegistry = CATEGORIES;
    expect((element as never as { _getAreaName: (areaId: string | null) => string })._getAreaName('kitchen')).toBe(
      'Kitchen'
    );
    expect((element as never as { _getLabelName: (labelId: string) => string })._getLabelName('missing_label')).toBe(
      'Missing Label'
    );
    expect((element as never as { _getCategoryName: (categoryId: string | null) => string })._getCategoryName(null)).toBe(
      'Uncategorized'
    );

    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    (element as never as { _searchTimeout: number | null })._searchTimeout = window.setTimeout(() => {}, 1000);
    element.disconnectedCallback();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect((element as never as { _searchTimeout: number | null })._searchTimeout).toBeNull();
  });
});
