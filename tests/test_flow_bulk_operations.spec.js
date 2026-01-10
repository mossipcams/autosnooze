/**
 * Tests for User Flow 3: Bulk Operations (By Area/Label)
 *
 * This file tests the bulk operations flow including:
 * - Area grouping and filtering
 * - Label grouping and filtering
 * - Category grouping and filtering
 * - Group expansion and selection
 * - Filter tab interactions
 * - Area/Label helper functions
 */

import { vi } from 'vitest';
import '../src/index.js';

// =============================================================================
// AREA/LABEL HELPERS
// =============================================================================

describe('Area/Label Helpers', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.test_automation': {
          entity_id: 'automation.test_automation',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
        },
        'sensor.autosnooze_status': {
          state: 'idle',
          attributes: { paused_count: 0, scheduled_count: 0 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: {
            paused_automations: {},
            scheduled_snoozes: {},
          },
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test.each([
    ['null', null, 'Unassigned'],
    ['undefined', undefined, 'Unassigned'],
    ['formats area_id', 'living_room', 'Living Room'],
  ])('_getAreaName with %s returns %s', (_, input, expected) => {
    expect(card._getAreaName(input)).toBe(expected);
  });

  test('_getAreaName returns area name from hass', () => {
    card.hass = { ...mockHass, areas: { living_room: { name: 'Living Room' } } };
    expect(card._getAreaName('living_room')).toBe('Living Room');
  });

  test('_getCategoryName returns "Uncategorized" for null', () => {
    expect(card._getCategoryName(null)).toBe('Uncategorized');
  });

  test.each([
    ['from registry', { lighting: { name: 'Lighting' } }, 'lighting', 'Lighting'],
    ['formatted from id', {}, 'my_custom_label', 'My Custom Label'],
  ])('_getLabelName %s', (_, registry, input, expected) => {
    card._labelRegistry = registry;
    expect(card._getLabelName(input)).toBe(expected);
  });
});

// =============================================================================
// GROUP EXPANSION
// =============================================================================

describe('Group Expansion', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.test_automation': {
          entity_id: 'automation.test_automation',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
        },
        'sensor.autosnooze_status': {
          state: 'idle',
          attributes: { paused_count: 0, scheduled_count: 0 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: {
            paused_automations: {},
            scheduled_snoozes: {},
          },
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_toggleGroupExpansion toggles group state', () => {
    expect(card._expandedGroups['Test']).toBeUndefined();
    card._toggleGroupExpansion('Test');
    expect(card._expandedGroups['Test']).toBeDefined();
    const firstState = card._expandedGroups['Test'];
    card._toggleGroupExpansion('Test');
    expect(card._expandedGroups['Test']).toBe(!firstState);
  });

  test('_selectGroup selects all items in group', () => {
    const items = [{ id: 'automation.a' }, { id: 'automation.b' }];
    card._selectGroup(items);
    expect(card._selected).toContain('automation.a');
    expect(card._selected).toContain('automation.b');
  });

  test('_selectGroup deselects all if all selected', () => {
    const items = [{ id: 'automation.a' }, { id: 'automation.b' }];
    card._selected = ['automation.a', 'automation.b'];
    card._selectGroup(items);
    expect(card._selected).not.toContain('automation.a');
    expect(card._selected).not.toContain('automation.b');
  });
});

// =============================================================================
// FILTER TAB INTERACTIONS
// =============================================================================

describe('Filter Tab Interactions', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.test_automation': {
          entity_id: 'automation.test_automation',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
        },
        'automation.living_room': {
          entity_id: 'automation.living_room',
          state: 'on',
          attributes: { friendly_name: 'Living Room Automation' },
        },
        'sensor.autosnooze_status': {
          state: 'idle',
          attributes: { paused_count: 0, scheduled_count: 0 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: {
            paused_automations: {},
            scheduled_snoozes: {},
          },
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test.each([
    ['Areas', 'areas'],
    ['Categories', 'categories'],
    ['Labels', 'labels'],
    ['All', 'all'],
  ])('clicking %s tab changes filter to %s', async (tabLabel, expectedFilter) => {
    if (expectedFilter === 'all') card._filterTab = 'areas';
    await card.updateComplete;

    const tabs = card.shadowRoot.querySelectorAll('.tab');
    const tab = Array.from(tabs).find((t) => t.textContent.includes(tabLabel));
    tab.click();
    await card.updateComplete;

    expect(card._filterTab).toBe(expectedFilter);
  });

  test.each([
    ['all', '.list-item', 2, 'flat list items'],
    ['areas', '.group-header', 1, 'group headers'],
  ])('renders %s in "%s" tab', async (tab, selector, minCount) => {
    card._filterTab = tab;
    await card.updateComplete;
    const elements = card.shadowRoot.querySelectorAll(selector);
    expect(elements.length).toBeGreaterThanOrEqual(minCount);
  });
});

// =============================================================================
// LABEL AND AREA GROUPING
// =============================================================================

describe('Label and Area Grouping', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.living_room_lights': {
          entity_id: 'automation.living_room_lights',
          state: 'on',
          attributes: { friendly_name: 'Living Room Lights' },
        },
        'automation.bedroom_fan': {
          entity_id: 'automation.bedroom_fan',
          state: 'on',
          attributes: { friendly_name: 'Bedroom Fan' },
        },
        'automation.kitchen_motion': {
          entity_id: 'automation.kitchen_motion',
          state: 'on',
          attributes: { friendly_name: 'Kitchen Motion' },
        },
        'sensor.autosnooze_status': {
          state: 'idle',
          attributes: { paused_count: 0, scheduled_count: 0 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      entities: {
        'automation.living_room_lights': { area_id: 'living_room', labels: ['lighting'] },
        'automation.bedroom_fan': { area_id: 'bedroom', labels: ['climate', 'comfort'] },
        'automation.kitchen_motion': { area_id: null, labels: [] },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;

    card._labelRegistry = {
      lighting: { name: 'Lighting' },
      climate: { name: 'Climate Control' },
      comfort: { name: 'Comfort' },
    };

    card._automationsCache = null;
    card._automationsCacheKey = null;

    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('_getGroupedByArea', () => {
    test('groups automations by area', () => {
      const grouped = card._getGroupedByArea();
      expect(grouped.length).toBeGreaterThan(0);

      const groupNames = grouped.map((g) => g[0]);
      expect(groupNames).toContain('Living Room');
      expect(groupNames).toContain('Bedroom');
    });

    test('puts unassigned automations in "Unassigned" group', () => {
      const grouped = card._getGroupedByArea();
      const unassigned = grouped.find((g) => g[0] === 'Unassigned');
      expect(unassigned).toBeDefined();
      expect(unassigned[1].length).toBe(1);
    });

    test('sorts groups alphabetically with Unassigned last', () => {
      const grouped = card._getGroupedByArea();
      const groupNames = grouped.map((g) => g[0]);

      expect(groupNames[groupNames.length - 1]).toBe('Unassigned');

      const nonUnassigned = groupNames.filter((n) => n !== 'Unassigned');
      const sorted = [...nonUnassigned].sort();
      expect(nonUnassigned).toEqual(sorted);
    });
  });

  describe('_getGroupedByLabel', () => {
    test('groups automations by label', () => {
      const grouped = card._getGroupedByLabel();
      expect(grouped.length).toBeGreaterThan(0);

      const groupNames = grouped.map((g) => g[0]);
      expect(groupNames).toContain('Lighting');
      expect(groupNames.some((n) => n.toLowerCase().includes('climate'))).toBe(true);
    });

    test('puts unlabeled automations in "Unlabeled" group', () => {
      const grouped = card._getGroupedByLabel();
      const unlabeled = grouped.find((g) => g[0] === 'Unlabeled');
      expect(unlabeled).toBeDefined();
    });

    test('automation with multiple labels appears in multiple groups', () => {
      const grouped = card._getGroupedByLabel();
      const groupsWithBedroomFan = grouped.filter((g) =>
        g[1].some((a) => a.id === 'automation.bedroom_fan')
      );

      expect(groupsWithBedroomFan.length).toBe(2);
    });

    test('sorts groups alphabetically with Unlabeled last', () => {
      const grouped = card._getGroupedByLabel();
      const groupNames = grouped.map((g) => g[0]);

      expect(groupNames[groupNames.length - 1]).toBe('Unlabeled');
    });
  });

  describe('_getLabelCount', () => {
    test('returns count of unique labels', () => {
      const count = card._getLabelCount();
      expect(count).toBe(3);
    });
  });

  test('shows empty message when grouped view has no automations', async () => {
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_status': {
          state: 'idle',
          attributes: { paused_count: 0, scheduled_count: 0 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      entities: {},
    });
    card._filterTab = 'areas';
    await card.updateComplete;

    const emptyMessage = card.shadowRoot.querySelector('.list-empty');
    expect(emptyMessage).not.toBeNull();
    expect(emptyMessage.textContent).toContain('No automations found');
  });
});

// =============================================================================
// CATEGORIES FEATURE
// =============================================================================

describe('Categories Feature', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.living_room_lights': {
          entity_id: 'automation.living_room_lights',
          state: 'on',
          attributes: { friendly_name: 'Living Room Lights' },
        },
        'automation.kitchen_lights': {
          entity_id: 'automation.kitchen_lights',
          state: 'on',
          attributes: { friendly_name: 'Kitchen Lights' },
        },
        'automation.alarm_arm': {
          entity_id: 'automation.alarm_arm',
          state: 'on',
          attributes: { friendly_name: 'Arm Alarm' },
        },
        'automation.misc': {
          entity_id: 'automation.misc',
          state: 'on',
          attributes: { friendly_name: 'Misc Automation' },
        },
        'sensor.autosnooze_status': {
          state: 'idle',
          attributes: { paused_count: 0, scheduled_count: 0 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;

    card._entityRegistry = {
      'automation.living_room_lights': {
        entity_id: 'automation.living_room_lights',
        area_id: 'living_room',
        categories: { automation: 'cat_lighting' },
        labels: [],
      },
      'automation.kitchen_lights': {
        entity_id: 'automation.kitchen_lights',
        area_id: 'kitchen',
        categories: { automation: 'cat_lighting' },
        labels: [],
      },
      'automation.alarm_arm': {
        entity_id: 'automation.alarm_arm',
        area_id: null,
        categories: { automation: 'cat_security' },
        labels: [],
      },
      'automation.misc': {
        entity_id: 'automation.misc',
        area_id: null,
        categories: {},
        labels: [],
      },
    };
    card._entityRegistryFetched = true;

    card._categoryRegistry = {
      cat_lighting: { category_id: 'cat_lighting', name: 'Lighting' },
      cat_security: { category_id: 'cat_security', name: 'Security' },
    };
    card._categoriesFetched = true;

    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Category extraction from entity registry', () => {
    test('extracts category_id from entity registry', () => {
      const automations = card._getAutomations();
      const livingRoom = automations.find((a) => a.id === 'automation.living_room_lights');
      expect(livingRoom.category_id).toBe('cat_lighting');
    });

    test('returns null category_id when no category assigned', () => {
      const automations = card._getAutomations();
      const misc = automations.find((a) => a.id === 'automation.misc');
      expect(misc.category_id).toBeNull();
    });
  });

  describe('Category counting', () => {
    test('_getCategoryCount returns correct unique count', () => {
      expect(card._getCategoryCount()).toBe(2);
    });

    test('_getCategoryCount returns 0 when no categories assigned', () => {
      card._entityRegistry = {
        'automation.test': {
          entity_id: 'automation.test',
          categories: {},
          labels: [],
        },
      };
      card.hass.states = {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      };
      card._automationsCache = null;
      expect(card._getCategoryCount()).toBe(0);
    });
  });

  describe('Category name resolution', () => {
    test('_getCategoryName returns name from registry', () => {
      expect(card._getCategoryName('cat_lighting')).toBe('Lighting');
    });

    test('_getCategoryName returns "Uncategorized" for null', () => {
      expect(card._getCategoryName(null)).toBe('Uncategorized');
    });

    test('_getCategoryName transforms ID if not in registry', () => {
      expect(card._getCategoryName('some_test_category')).toBe('Some Test Category');
    });
  });

  describe('Category grouping', () => {
    test('_getGroupedByCategory groups automations correctly', () => {
      const grouped = card._getGroupedByCategory();
      const groupNames = grouped.map(([name]) => name);

      expect(groupNames).toContain('Lighting');
      expect(groupNames).toContain('Security');
      expect(groupNames).toContain('Uncategorized');
    });

    test('groups have correct automation count', () => {
      const grouped = card._getGroupedByCategory();
      const groupMap = Object.fromEntries(grouped);

      expect(groupMap['Lighting'].length).toBe(2);
      expect(groupMap['Security'].length).toBe(1);
      expect(groupMap['Uncategorized'].length).toBe(1);
    });

    test('groups are sorted alphabetically with Uncategorized last', () => {
      const grouped = card._getGroupedByCategory();
      const groupNames = grouped.map(([name]) => name);

      expect(groupNames[0]).toBe('Lighting');
      expect(groupNames[1]).toBe('Security');
      expect(groupNames[groupNames.length - 1]).toBe('Uncategorized');
    });
  });

  describe('Categories tab UI', () => {
    test('switching to categories tab renders category groups', async () => {
      card._filterTab = 'all';
      await card.updateComplete;

      card._filterTab = 'categories';
      await card.updateComplete;

      const categoryHeaders = card.shadowRoot.querySelectorAll('.group-header');
      expect(categoryHeaders.length).toBeGreaterThan(0);

      const headerTexts = Array.from(categoryHeaders).map((h) => h.textContent);
      expect(headerTexts.some((t) => t.includes('Lighting') || t.includes('Security'))).toBe(true);
    });

    test('renders category groups in categories tab with correct count', async () => {
      card._filterTab = 'categories';
      await card.updateComplete;

      const groupHeaders = card.shadowRoot.querySelectorAll('.group-header');
      expect(groupHeaders.length).toBe(3);

      const checkboxes = card.shadowRoot.querySelectorAll('input[type="checkbox"]');
      const listItems = card.shadowRoot.querySelectorAll('label, .item, li');
      expect(checkboxes.length + listItems.length).toBeGreaterThan(0);
    });
  });
});
