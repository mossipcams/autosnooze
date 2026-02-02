/**
 * Tests for Automation Categories Feature
 *
 * These tests verify the automation categories implementation where:
 * - Automations are grouped by category when viewing the Categories tab
 * - Categories are fetched from Home Assistant's category registry
 * - Category names are resolved via registry lookup with fallback
 * - Uncategorized automations are grouped together and sorted last
 */

import { vi } from 'vitest';
import '../custom_components/autosnooze/www/autosnooze-card.js';

// =============================================================================
// HELPER: Shadow DOM helpers for child component access
// =============================================================================
function _computeAutomations(card) {
  const states = card.hass?.states || {};
  const entityReg = card._entityRegistry || {};
  const hassEntities = card.hass?.entities || {};
  return Object.entries(states)
    .filter(([id, state]) => id.startsWith('automation.') && state)
    .map(([id, state]) => {
      const reg = entityReg[id] || {};
      const hassEntry = hassEntities[id] || {};
      const categories = reg.categories || {};
      return {
        id,
        name: state.attributes?.friendly_name || id,
        area_id: reg.area_id ?? hassEntry.area_id ?? null,
        labels: reg.labels ?? hassEntry.labels ?? [],
        category_id: categories.automation ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function queryAutomationList(card) {
  // If card has rendered, find child in shadow DOM
  const sr = card.shadowRoot;
  if (sr) {
    const child = sr.querySelector('autosnooze-automation-list');
    if (child) {
      // Sync all properties from card to child (may not have re-rendered yet)
      if (card.hass) child.hass = card.hass;
      if (card._selected !== undefined) child.selected = card._selected;
      if (card._labelRegistry) child.labelRegistry = card._labelRegistry;
      if (card._categoryRegistry) child.categoryRegistry = card._categoryRegistry;
      // Recompute automations from card's current state (entity registry may have changed)
      child.automations = _computeAutomations(card);
      return child;
    }
  }
  // For tests that access child methods without rendering:
  // Create a standalone automation list with synced data
  if (!card.__automationList) {
    const list = document.createElement('autosnooze-automation-list');
    // Listen for selection-change events on the element itself
    list.addEventListener('selection-change', (e) => {
      list.selected = e.detail.selected;
      card._selected = e.detail.selected;
    });
    card.__automationList = list;
  }
  const list = card.__automationList;
  // Sync state from card to child
  if (card.hass) list.hass = card.hass;
  list.automations = _computeAutomations(card);
  list.selected = card._selected || [];
  list.labelRegistry = card._labelRegistry || {};
  list.categoryRegistry = card._categoryRegistry || {};
  return list;
}

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

    // Set up entity registry with categories
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

    // Set up category registry
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
      expect(queryAutomationList(card)._getCategoryCount()).toBe(2);
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
      expect(queryAutomationList(card)._getCategoryCount()).toBe(0);
    });
  });

  describe('Category name resolution', () => {
    test('_getCategoryName returns name from registry', () => {
      expect(queryAutomationList(card)._getCategoryName('cat_lighting')).toBe('Lighting');
    });

    test('_getCategoryName returns "Uncategorized" for null', () => {
      expect(queryAutomationList(card)._getCategoryName(null)).toBe('Uncategorized');
    });

    test('_getCategoryName transforms ID if not in registry', () => {
      expect(queryAutomationList(card)._getCategoryName('some_test_category')).toBe('Some Test Category');
    });
  });

  describe('Category grouping', () => {
    test('_getGroupedByCategory groups automations correctly', () => {
      const grouped = queryAutomationList(card)._getGroupedByCategory();
      const groupNames = grouped.map(([name]) => name);

      expect(groupNames).toContain('Lighting');
      expect(groupNames).toContain('Security');
      expect(groupNames).toContain('Uncategorized');
    });

    test('groups have correct automation count', () => {
      const grouped = queryAutomationList(card)._getGroupedByCategory();
      const groupMap = Object.fromEntries(grouped);

      expect(groupMap['Lighting'].length).toBe(2);
      expect(groupMap['Security'].length).toBe(1);
      expect(groupMap['Uncategorized'].length).toBe(1);
    });

    test('groups are sorted alphabetically with Uncategorized last', () => {
      const grouped = queryAutomationList(card)._getGroupedByCategory();
      const groupNames = grouped.map(([name]) => name);

      expect(groupNames[0]).toBe('Lighting');
      expect(groupNames[1]).toBe('Security');
      expect(groupNames[groupNames.length - 1]).toBe('Uncategorized');
    });
  });

  describe('Categories tab UI', () => {
    test('switching to categories tab renders category groups', async () => {
      // Start with a different tab
      queryAutomationList(card)._filterTab = 'all';
      await card.updateComplete;

      // Get initial group headers count (should be 0 or different structure in 'all' tab)
      const initialHeaders = queryAutomationList(card).shadowRoot.querySelectorAll('.group-header');

      // Switch to categories tab
      queryAutomationList(card)._filterTab = 'categories';
      await card.updateComplete;

      // Verify the DOM actually changed - categories tab should show group headers
      const categoryHeaders = queryAutomationList(card).shadowRoot.querySelectorAll('.group-header');
      expect(categoryHeaders.length).toBeGreaterThan(0);

      // Verify category names are rendered (Lighting, Security, Uncategorized)
      const headerTexts = Array.from(categoryHeaders).map((h) => h.textContent);
      expect(headerTexts.some((t) => t.includes('Lighting') || t.includes('Security'))).toBe(true);
    });

    test('renders category groups in categories tab with correct count', async () => {
      const list = queryAutomationList(card);
      list._filterTab = 'categories';
      await list.updateComplete;

      const groupHeaders = list.shadowRoot.querySelectorAll('.group-header');
      // Should have 3 groups: Lighting (2 automations), Security (1), Uncategorized (1)
      expect(groupHeaders.length).toBe(3);

      // Verify rendered content (check for list items in child's shadow DOM)
      const listItems = list.shadowRoot.querySelectorAll('.list-item');
      // Should have rendered some interactive elements for the automations
      expect(listItems.length).toBeGreaterThan(0);
    });
  });
});

describe('Entity Registry Fetch', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });

    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });

    card.hass.connection = {
      sendMessagePromise: vi.fn().mockResolvedValue([
        { entity_id: 'automation.test', categories: { automation: 'cat_test' }, labels: [] },
      ]),
    };

    card._entityRegistryFetched = false;
    card._entityRegistry = {};
  });

  test('_fetchEntityRegistry sets _entityRegistryFetched flag to true', async () => {
    expect(card._entityRegistryFetched).toBe(false);

    await card._fetchEntityRegistry();

    expect(card._entityRegistryFetched).toBe(true);
  });

  test('_fetchEntityRegistry populates _entityRegistry', async () => {
    expect(Object.keys(card._entityRegistry).length).toBe(0);

    await card._fetchEntityRegistry();

    expect(card._entityRegistry['automation.test']).toBeDefined();
    expect(card._entityRegistry['automation.test'].entity_id).toBe('automation.test');
  });

  test('_fetchEntityRegistry filters to only automation entities', async () => {
    card.hass.connection.sendMessagePromise.mockResolvedValueOnce([
      { entity_id: 'automation.test', categories: {}, labels: [] },
      { entity_id: 'light.test', categories: {}, labels: [] },
      { entity_id: 'switch.test', categories: {}, labels: [] },
    ]);

    await card._fetchEntityRegistry();

    expect(card._entityRegistry['automation.test']).toBeDefined();
    expect(card._entityRegistry['light.test']).toBeUndefined();
    expect(card._entityRegistry['switch.test']).toBeUndefined();
  });
});

describe('Category Registry Fetch', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });

    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });

    card.hass.connection = {
      sendMessagePromise: vi.fn().mockResolvedValue([
        { category_id: 'cat_lighting', name: 'Lighting' },
        { category_id: 'cat_security', name: 'Security' },
      ]),
    };

    card._categoriesFetched = false;
    card._categoryRegistry = {};
  });

  test('_fetchCategoryRegistry fetches with automation scope', async () => {
    await card._fetchCategoryRegistry();

    expect(card.hass.connection.sendMessagePromise).toHaveBeenCalledWith({
      type: 'config/category_registry/list',
      scope: 'automation',
    });
  });

  test('_fetchCategoryRegistry populates _categoryRegistry', async () => {
    await card._fetchCategoryRegistry();

    expect(card._categoryRegistry['cat_lighting']).toBeDefined();
    expect(card._categoryRegistry['cat_lighting'].name).toBe('Lighting');
    expect(card._categoryRegistry['cat_security']).toBeDefined();
  });

  test('_fetchCategoryRegistry sets _categoriesFetched flag', async () => {
    expect(card._categoriesFetched).toBe(false);

    await card._fetchCategoryRegistry();

    expect(card._categoriesFetched).toBe(true);
  });
});
