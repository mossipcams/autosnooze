// @ts-nocheck -- migrated from JS, type annotations deferred
/**
 * Boundary Mutation Tests
 *
 * Tests specifically designed to kill mutants related to:
 * - String operations and defaults
 * - Comparison boundaries
 * - Grouping and sorting logic
 * - Registry lookups
 * - Date/time formatting
 *
 * Uses test.each for parametrized testing where applicable.
 */

import { vi } from 'vitest';
import '../custom_components/autosnooze/www/autosnooze-card.js';
import { formatCountdown } from '../src/utils/index.js';
import { formatRegistryId } from '../src/state/automations.js';
import { queryAutomationList } from './helpers/query-helpers.js';

// =============================================================================
// HELPER: Create Card Instance
// =============================================================================
function createCard() {
  const card = document.createElement('autosnooze-card');
  card.setConfig({ title: 'Test' });
  card.hass = {
    connection: { sendMessagePromise: () => Promise.resolve([]) },
    states: {},
    areas: {},
    entities: {},
    config: { time_zone: 'UTC' },
  };
  return card;
}

// =============================================================================
// FORMAT REGISTRY ID TESTS (Parametrized)
// =============================================================================
describe('_formatRegistryId', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let card: any;
  beforeEach(() => {
    card = createCard();
  });

  test.each([
    ['living_room', 'Living Room', 'replaces underscores with spaces'],
    ['kitchen', 'Kitchen', 'handles single word'],
    ['a_b_c_d', 'A B C D', 'handles multiple underscores'],
    ['', '', 'handles empty string'],
    ['room_1', 'Room 1', 'preserves numbers'],
  ])('"%s" → "%s" (%s)', (input, expected) => {
    const result = formatRegistryId(input);
    expect(result).toBe(expected);
  });

  test('output contains no underscores', () => {
    const result = formatRegistryId('living_room');
    expect(result).toContain(' ');
    expect(result).not.toContain('_');
  });
});

// =============================================================================
// GET AREA NAME TESTS (Parametrized)
// =============================================================================
describe('_getAreaName', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let card: any;
  beforeEach(() => {
    card = createCard();
  });

  test.each([
    [null, 'Unassigned'],
    [undefined, 'Unassigned'],
    ['', 'Unassigned'],
  ])('returns "Unassigned" for falsy value: %s', (input, expected) => {
    const result = queryAutomationList(card)._getAreaName(input);
    expect(result).toBe(expected);
  });

  test('returns area name from hass when available', () => {
    card.hass.areas = { living_room: { name: 'Living Room' } };
    expect(queryAutomationList(card)._getAreaName('living_room')).toBe('Living Room');
  });

  test('falls back to formatted ID when area not in hass', () => {
    card.hass.areas = {};
    expect(queryAutomationList(card)._getAreaName('my_area')).toBe('My Area');
  });
});

// =============================================================================
// GET LABEL NAME TESTS
// =============================================================================
describe('_getLabelName', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let card: any;
  beforeEach(() => {
    card = createCard();
  });

  test('returns label name from registry', () => {
    card._labelRegistry = { test_label: { name: 'Test Label' } };
    expect(queryAutomationList(card)._getLabelName('test_label')).toBe('Test Label');
  });

  test('falls back to formatted ID when not in registry', () => {
    card._labelRegistry = {};
    expect(queryAutomationList(card)._getLabelName('my_label')).toBe('My Label');
  });
});

// =============================================================================
// GET CATEGORY NAME TESTS (Parametrized)
// =============================================================================
describe('_getCategoryName', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let card: any;
  beforeEach(() => {
    card = createCard();
  });

  test.each([
    [null, 'Uncategorized'],
    [undefined, 'Uncategorized'],
    ['', 'Uncategorized'],
  ])('returns "Uncategorized" for falsy value: %s', (input, expected) => {
    const result = queryAutomationList(card)._getCategoryName(input);
    expect(result).toBe(expected);
  });

  test('returns category name from registry', () => {
    card._categoryRegistry = { lights: { name: 'Lights' } };
    expect(queryAutomationList(card)._getCategoryName('lights')).toBe('Lights');
  });

  test('falls back to formatted ID when not in registry', () => {
    card._categoryRegistry = {};
    expect(queryAutomationList(card)._getCategoryName('my_category')).toBe('My Category');
  });
});

// =============================================================================
// GROUPING LOGIC TESTS
// =============================================================================
describe('_groupAutomationsBy Sorting', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card.hass.states = {
      'automation.b_auto': { attributes: { friendly_name: 'B Auto' } },
      'automation.a_auto': { attributes: { friendly_name: 'A Auto' } },
      'automation.c_auto': { attributes: { friendly_name: 'C Auto' } },
    };
    card._entityRegistry = {};
    queryAutomationList(card)._search = '';
  });

  test('default group appears last in sorting', () => {
    card._entityRegistry = {
      'automation.a_auto': { area_id: 'room1' },
      'automation.b_auto': { area_id: null },
      'automation.c_auto': { area_id: 'room2' },
    };
    card.hass.areas = { room1: { name: 'Room 1' }, room2: { name: 'Room 2' } };

    const groups = queryAutomationList(card)._getGroupedByArea();
    const lastGroup = groups[groups.length - 1];
    expect(lastGroup[0]).toBe('Unassigned');
  });

  test('groups are sorted alphabetically', () => {
    card._entityRegistry = {
      'automation.a_auto': { area_id: 'zebra' },
      'automation.b_auto': { area_id: 'apple' },
      'automation.c_auto': { area_id: 'mango' },
    };
    card.hass.areas = {
      zebra: { name: 'Zebra' },
      apple: { name: 'Apple' },
      mango: { name: 'Mango' },
    };

    const groups = queryAutomationList(card)._getGroupedByArea();
    expect(groups[0][0]).toBe('Apple');
    expect(groups[1][0]).toBe('Mango');
    expect(groups[2][0]).toBe('Zebra');
  });
});

// =============================================================================
// SEARCH FILTERING TESTS (Parametrized)
// =============================================================================
describe('_getFilteredAutomations Search', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card.hass.states = {
      'automation.kitchen_lights': { attributes: { friendly_name: 'Kitchen Lights' } },
      'automation.bedroom_fan': { attributes: { friendly_name: 'Bedroom Fan' } },
      'automation.living_room': { attributes: { friendly_name: 'Living Room' } },
    };
    card._entityRegistry = {};
  });

  test.each([
    ['KITCHEN', 1, 'Kitchen Lights', 'case insensitive search on name'],
    ['BEDROOM', 1, 'Bedroom Fan', 'case insensitive search on ID'],
    ['light', 1, 'Kitchen Lights', 'partial match on name'],
    ['living', 1, 'Living Room', 'partial match on ID'],
    ['', 3, null, 'returns all when search is empty'],
    ['nonexistent', 0, null, 'returns empty when no match'],
  ])('search "%s" returns %d results (%s)', (search, expectedCount, expectedName) => {
    queryAutomationList(card)._search = search;
    const filtered = queryAutomationList(card)._getFilteredAutomations();
    expect(filtered.length).toBe(expectedCount);
    if (expectedName && filtered.length > 0) {
      expect(filtered[0].name).toBe(expectedName);
    }
  });
});

// =============================================================================
// GET UNIQUE COUNT TESTS
// =============================================================================
describe('_getAreaCount', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card.hass.states = {
      'automation.a': { attributes: { friendly_name: 'A' } },
      'automation.b': { attributes: { friendly_name: 'B' } },
      'automation.c': { attributes: { friendly_name: 'C' } },
    };
    card._entityRegistry = {
      'automation.a': { area_id: 'room1' },
      'automation.b': { area_id: 'room1' }, // Same area
      'automation.c': { area_id: 'room2' },
    };
  });

  test('counts unique areas correctly', () => {
    expect(queryAutomationList(card)._getAreaCount()).toBe(2);
  });

  test('returns 0 when no areas assigned', () => {
    card._entityRegistry = {};
    expect(queryAutomationList(card)._getAreaCount()).toBe(0);
  });
});

// =============================================================================
// SELECTION LOGIC TESTS
// =============================================================================
describe('_selectAllVisible', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card.hass.states = {
      'automation.a': { attributes: { friendly_name: 'A' } },
      'automation.b': { attributes: { friendly_name: 'B' } },
    };
    card._entityRegistry = {};
    queryAutomationList(card)._search = '';
    card._selected = [];
  });

  test('selects all when none selected', () => {
    queryAutomationList(card)._selectAllVisible();
    expect(card._selected).toContain('automation.a');
    expect(card._selected).toContain('automation.b');
    expect(card._selected.length).toBe(2);
  });

  test('deselects all when all selected', () => {
    card._selected = ['automation.a', 'automation.b'];
    queryAutomationList(card)._selectAllVisible();
    expect(card._selected.length).toBe(0);
  });

  test('selects remaining when some selected', () => {
    card._selected = ['automation.a'];
    queryAutomationList(card)._selectAllVisible();
    expect(card._selected).toContain('automation.a');
    expect(card._selected).toContain('automation.b');
  });
});

// =============================================================================
// COUNTDOWN FORMATTING TESTS (Parametrized)
// =============================================================================
describe('_formatCountdown', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let card: any;
  beforeEach(() => {
    card = createCard();
  });

  test.each([
    [-60000, 'Resuming...', 'past times'],
    [2 * 60 * 60 * 1000, 'h', 'more than 60 minutes includes hours'],
    [30 * 60 * 1000, 'm', 'includes minutes'],
    [45 * 1000, 's', 'includes seconds'],
  ])('offset %dms contains "%s" (%s)', (offset, expected) => {
    const future = new Date(Date.now() + offset).toISOString();
    const result = formatCountdown(future);
    if (expected === 'Resuming...') {
      expect(result).toBe(expected);
    } else {
      expect(result).toContain(expected);
    }
  });
});

// =============================================================================
// DATE TIME FORMATTING TESTS
// =============================================================================
describe('_formatDateTime', () => {
  let card;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T14:30:00.000Z'));
    card = createCard();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test.each([
    ['2025-01-16T10:00:00.000Z', 'Thu', 'Jan', '16'],
    ['2025-01-17T10:00:00.000Z', 'Fri', 'Jan', '17'],
  ])('formats %s with weekday=%s, month=%s, day=%s', (dateStr, weekday, month, day) => {
    const result = card._formatDateTime(dateStr);
    expect(result).toContain(weekday);
    expect(result).toContain(month);
    expect(result).toContain(day);
  });

  test('includes time with colon separator', () => {
    const result = card._formatDateTime('2025-01-16T10:30:00.000Z');
    expect(result).toContain(':');
    expect(result).toContain('30');
    expect(result).toMatch(/\d{1,2}:\d{2}(\s?(AM|PM))?/i);
  });

  test('different dates produce different outputs', () => {
    const thursday = card._formatDateTime('2025-01-16T10:00:00.000Z');
    const friday = card._formatDateTime('2025-01-17T10:00:00.000Z');
    expect(thursday).not.toEqual(friday);
  });
});

// =============================================================================
// PAUSED GROUPING TESTS
// =============================================================================
describe('_getPausedGroupedByResumeTime', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let card: any;
  beforeEach(() => {
    card = createCard();
  });

  test('groups are sorted by resume time ascending', () => {
    const now = Date.now();
    card.hass.states = {
      'sensor.autosnooze_snoozed_automations': {
        attributes: {
          paused_automations: {
            'automation.a': { resume_at: new Date(now + 3600000).toISOString(), disable_at: null },
            'automation.b': { resume_at: new Date(now + 1800000).toISOString(), disable_at: null },
            'automation.c': { resume_at: new Date(now + 7200000).toISOString(), disable_at: null },
          },
        },
      },
    };

    const groups = card._getPausedGroupedByResumeTime();
    const times = groups.map((g) => new Date(g.resumeAt).getTime());
    expect(times[0]).toBeLessThan(times[1]);
    expect(times[1]).toBeLessThan(times[2]);
  });

  test('automations with same resume time are grouped together', () => {
    const sameTime = new Date(Date.now() + 3600000).toISOString();
    card.hass.states = {
      'sensor.autosnooze_snoozed_automations': {
        attributes: {
          paused_automations: {
            'automation.a': { resume_at: sameTime, disable_at: null },
            'automation.b': { resume_at: sameTime, disable_at: null },
          },
        },
      },
    };

    const groups = card._getPausedGroupedByResumeTime();
    expect(groups.length).toBe(1);
    expect(groups[0].automations.length).toBe(2);
  });
});

// =============================================================================
// AUTOMATION ID PARSING TESTS
// =============================================================================
describe('Automation ID Parsing', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card._entityRegistry = {};
  });

  test('filters to only automation.* entities', () => {
    card.hass.states = {
      'automation.test': { attributes: { friendly_name: 'Test' } },
      'light.test': { attributes: { friendly_name: 'Test Light' } },
      'switch.test': { attributes: { friendly_name: 'Test Switch' } },
    };

    const automations = card._getAutomations();
    expect(automations.length).toBe(1);
    expect(automations[0].id).toBe('automation.test');
  });

  test('uses friendly_name when available', () => {
    card.hass.states = {
      'automation.my_auto': { attributes: { friendly_name: 'My Automation' } },
    };
    expect(card._getAutomations()[0].name).toBe('My Automation');
  });

  test('falls back to ID when no friendly_name', () => {
    card.hass.states = {
      'automation.my_auto': { attributes: {} },
    };
    expect(card._getAutomations()[0].name).toBe('my_auto');
  });
});

// =============================================================================
// TOGGLE SELECTION TESTS
// =============================================================================
describe('_toggleSelection', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card._selected = [];
  });

  test('adds item when not selected', () => {
    queryAutomationList(card)._toggleSelection('automation.a');
    expect(card._selected).toContain('automation.a');
  });

  test('removes item when already selected', () => {
    card._selected = ['automation.a'];
    queryAutomationList(card)._toggleSelection('automation.a');
    expect(card._selected).not.toContain('automation.a');
  });

  test('preserves other selections when toggling', () => {
    card._selected = ['automation.a', 'automation.b'];
    queryAutomationList(card)._toggleSelection('automation.a');
    expect(card._selected).not.toContain('automation.a');
    expect(card._selected).toContain('automation.b');
  });
});

// =============================================================================
// STATIC METHOD TESTS
// =============================================================================
describe('Static Methods', () => {
  test('getStubConfig returns object with title', () => {
    const AutosnoozeCard = customElements.get('autosnooze-card');
    const stub = AutosnoozeCard.getStubConfig();
    expect(stub).toHaveProperty('title');
    expect(stub.title).toBe('AutoSnooze');
  });

  test('getConfigElement creates editor element', () => {
    const AutosnoozeCard = customElements.get('autosnooze-card');
    const element = AutosnoozeCard.getConfigElement();
    expect(element.tagName.toLowerCase()).toBe('autosnooze-card-editor');
  });
});

// =============================================================================
// CLEAR SELECTION TESTS
// =============================================================================
describe('_clearSelection', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let card: any;
  beforeEach(() => {
    card = createCard();
  });

  test('clears all selected items', () => {
    card._selected = ['automation.a', 'automation.b', 'automation.c'];
    queryAutomationList(card)._clearSelection();
    expect(card._selected.length).toBe(0);
    expect(Array.isArray(card._selected)).toBe(true);
  });

  test('works when already empty', () => {
    card._selected = [];
    queryAutomationList(card)._clearSelection();
    expect(card._selected.length).toBe(0);
  });
});

// =============================================================================
// FILTER TAB TESTS
// =============================================================================
describe('Filter Tab', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card._entityRegistry = {};
    card.hass.states = {
      'automation.a': { attributes: { friendly_name: 'A' } },
    };
  });

  test('_filterTab defaults to "all"', () => {
    expect(queryAutomationList(card)._filterTab).toBe('all');
  });

  test('setting _filterTab changes filter', () => {
    queryAutomationList(card)._filterTab = 'areas';
    expect(queryAutomationList(card)._filterTab).toBe('areas');
  });
});

// =============================================================================
// GET PAUSED / SCHEDULED FALLBACK TESTS (Parametrized)
// =============================================================================
describe('_getPaused and _getScheduled Fallbacks', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let card: any;
  beforeEach(() => {
    card = createCard();
  });

  test.each([
    ['_getPaused', {}, 'sensor missing'],
    ['_getPaused', { 'sensor.autosnooze_snoozed_automations': { attributes: {} } }, 'attribute missing'],
    ['_getScheduled', {}, 'sensor missing'],
    ['_getScheduled', { 'sensor.autosnooze_snoozed_automations': { attributes: {} } }, 'attribute missing'],
  ])('%s returns empty object when %s', (method, states) => {
    card.hass.states = states;
    const result = card[method]();
    expect(result).toEqual({});
  });
});

// =============================================================================
// AUTOMATION CACHE TESTS
// =============================================================================
describe('Automation Cache', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card.hass.states = {
      'automation.a': { attributes: { friendly_name: 'A' } },
    };
    card._entityRegistry = {};
  });

  test('uses cache on subsequent calls with same state', () => {
    const first = card._getAutomations();
    const second = card._getAutomations();
    expect(first).toBe(second); // Same reference
  });

  test('invalidates cache when states change', () => {
    const first = card._getAutomations();

    card.hass = {
      ...card.hass,
      states: {
        'automation.b': { attributes: { friendly_name: 'B' } },
      },
    };

    const second = card._getAutomations();
    expect(first).not.toBe(second);
  });
});
