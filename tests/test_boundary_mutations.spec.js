/**
 * Boundary Mutation Tests
 *
 * Tests specifically designed to kill mutants related to:
 * - String operations and defaults
 * - Comparison boundaries
 * - Grouping and sorting logic
 * - Registry lookups
 * - Date/time formatting
 */

import '../src/autosnooze-card.js';

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
    config: { time_zone: 'UTC' }
  };
  return card;
}

// =============================================================================
// FORMAT REGISTRY ID TESTS
// =============================================================================
describe('_formatRegistryId String Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
  });

  test('replaces underscores with spaces', () => {
    const result = card._formatRegistryId('living_room');
    expect(result).toContain(' ');
    expect(result).not.toContain('_');
  });

  test('capitalizes first letter of each word', () => {
    const result = card._formatRegistryId('living_room');
    expect(result).toBe('Living Room');
  });

  test('handles single word', () => {
    const result = card._formatRegistryId('kitchen');
    expect(result).toBe('Kitchen');
  });

  test('handles multiple underscores', () => {
    const result = card._formatRegistryId('a_b_c_d');
    expect(result).toBe('A B C D');
  });

  test('handles empty string', () => {
    const result = card._formatRegistryId('');
    expect(result).toBe('');
  });

  test('preserves numbers', () => {
    const result = card._formatRegistryId('room_1');
    expect(result).toBe('Room 1');
  });
});

// =============================================================================
// GET AREA NAME TESTS
// =============================================================================
describe('_getAreaName Default Value Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
  });

  test('returns "Unassigned" for null area', () => {
    const result = card._getAreaName(null);
    expect(result).toBe('Unassigned');
  });

  test('returns "Unassigned" for undefined area', () => {
    const result = card._getAreaName(undefined);
    expect(result).toBe('Unassigned');
  });

  test('returns "Unassigned" for empty string', () => {
    const result = card._getAreaName('');
    expect(result).toBe('Unassigned');
  });

  test('returns area name from hass when available', () => {
    card.hass.areas = { 'living_room': { name: 'Living Room' } };
    const result = card._getAreaName('living_room');
    expect(result).toBe('Living Room');
  });

  test('falls back to formatted ID when area not in hass', () => {
    card.hass.areas = {};
    const result = card._getAreaName('my_area');
    expect(result).toBe('My Area');
  });
});

// =============================================================================
// GET LABEL NAME TESTS
// =============================================================================
describe('_getLabelName Default Value Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
  });

  test('returns label name from registry', () => {
    card._labelRegistry = { 'test_label': { name: 'Test Label' } };
    const result = card._getLabelName('test_label');
    expect(result).toBe('Test Label');
  });

  test('falls back to formatted ID when not in registry', () => {
    card._labelRegistry = {};
    const result = card._getLabelName('my_label');
    expect(result).toBe('My Label');
  });
});

// =============================================================================
// GET CATEGORY NAME TESTS
// =============================================================================
describe('_getCategoryName Default Value Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
  });

  test('returns "Uncategorized" for null category', () => {
    const result = card._getCategoryName(null);
    expect(result).toBe('Uncategorized');
  });

  test('returns "Uncategorized" for undefined category', () => {
    const result = card._getCategoryName(undefined);
    expect(result).toBe('Uncategorized');
  });

  test('returns "Uncategorized" for empty string', () => {
    const result = card._getCategoryName('');
    expect(result).toBe('Uncategorized');
  });

  test('returns category name from registry', () => {
    card._categoryRegistry = { 'lights': { name: 'Lights' } };
    const result = card._getCategoryName('lights');
    expect(result).toBe('Lights');
  });

  test('falls back to formatted ID when not in registry', () => {
    card._categoryRegistry = {};
    const result = card._getCategoryName('my_category');
    expect(result).toBe('My Category');
  });
});

// =============================================================================
// GROUPING LOGIC TESTS
// =============================================================================
describe('_groupAutomationsBy Sorting Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card.hass.states = {
      'automation.b_auto': { attributes: { friendly_name: 'B Auto' } },
      'automation.a_auto': { attributes: { friendly_name: 'A Auto' } },
      'automation.c_auto': { attributes: { friendly_name: 'C Auto' } },
    };
    card._entityRegistry = {};
    card._search = '';
  });

  test('default group appears last in sorting', () => {
    card._entityRegistry = {
      'automation.a_auto': { area_id: 'room1' },
      'automation.b_auto': { area_id: null },
      'automation.c_auto': { area_id: 'room2' },
    };
    card.hass.areas = { 'room1': { name: 'Room 1' }, 'room2': { name: 'Room 2' } };

    const groups = card._getGroupedByArea();
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
      'zebra': { name: 'Zebra' },
      'apple': { name: 'Apple' },
      'mango': { name: 'Mango' }
    };

    const groups = card._getGroupedByArea();
    expect(groups[0][0]).toBe('Apple');
    expect(groups[1][0]).toBe('Mango');
    expect(groups[2][0]).toBe('Zebra');
  });
});

// =============================================================================
// SEARCH FILTERING TESTS
// =============================================================================
describe('_getFilteredAutomations Search Mutations', () => {
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

  test('case insensitive search on name', () => {
    card._search = 'KITCHEN';
    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Kitchen Lights');
  });

  test('case insensitive search on ID', () => {
    card._search = 'BEDROOM';
    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('automation.bedroom_fan');
  });

  test('partial match on name', () => {
    card._search = 'light';
    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toContain('Light');
  });

  test('partial match on ID', () => {
    card._search = 'living';
    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toContain('living');
  });

  test('returns all when search is empty', () => {
    card._search = '';
    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(3);
  });

  test('returns empty when no match', () => {
    card._search = 'nonexistent';
    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(0);
  });
});

// =============================================================================
// GET UNIQUE COUNT TESTS
// =============================================================================
describe('_getUniqueCount Set Mutations', () => {
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
      'automation.b': { area_id: 'room1' },  // Same area
      'automation.c': { area_id: 'room2' },
    };
  });

  test('counts unique areas correctly', () => {
    const count = card._getAreaCount();
    expect(count).toBe(2);  // room1 and room2
  });

  test('returns 0 when no areas assigned', () => {
    card._entityRegistry = {};
    const count = card._getAreaCount();
    expect(count).toBe(0);
  });
});

// =============================================================================
// SELECTION LOGIC TESTS
// =============================================================================
describe('_selectAllVisible Toggle Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card.hass.states = {
      'automation.a': { attributes: { friendly_name: 'A' } },
      'automation.b': { attributes: { friendly_name: 'B' } },
    };
    card._entityRegistry = {};
    card._search = '';
    card._selected = [];
  });

  test('selects all when none selected', () => {
    card._selectAllVisible();
    expect(card._selected).toContain('automation.a');
    expect(card._selected).toContain('automation.b');
    expect(card._selected.length).toBe(2);
  });

  test('deselects all when all selected', () => {
    card._selected = ['automation.a', 'automation.b'];
    card._selectAllVisible();
    expect(card._selected.length).toBe(0);
  });

  test('selects remaining when some selected', () => {
    card._selected = ['automation.a'];
    card._selectAllVisible();
    expect(card._selected).toContain('automation.a');
    expect(card._selected).toContain('automation.b');
  });
});

// =============================================================================
// COUNTDOWN FORMATTING TESTS
// =============================================================================
describe('_formatCountdown Return Value Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
  });

  test('returns "Resuming..." for past times', () => {
    const pastTime = new Date(Date.now() - 60000).toISOString();
    const result = card._formatCountdown(pastTime);
    expect(result).toBe('Resuming...');
  });

  test('includes hours when more than 60 minutes', () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const result = card._formatCountdown(future);
    expect(result).toContain('h');
  });

  test('includes minutes in format', () => {
    const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const result = card._formatCountdown(future);
    expect(result).toContain('m');
  });

  test('includes seconds in format', () => {
    const future = new Date(Date.now() + 45 * 1000).toISOString();
    const result = card._formatCountdown(future);
    expect(result).toContain('s');
  });
});

// =============================================================================
// DATE TIME FORMATTING TESTS
// =============================================================================
describe('_formatDateTime Date Options Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
  });

  test('formats date with weekday', () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);  // Tomorrow
    const result = card._formatDateTime(date.toISOString());
    // Should contain day abbreviation (Mon, Tue, etc.)
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
  });

  test('formats date with month', () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const result = card._formatDateTime(date.toISOString());
    // Should contain month abbreviation
    expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
  });

  test('includes time portion', () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const result = card._formatDateTime(date.toISOString());
    // Should contain colon (time separator)
    expect(result).toContain(':');
  });
});

// =============================================================================
// PAUSED GROUPING TESTS
// =============================================================================
describe('_getPausedGroupedByResumeTime Sorting Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
  });

  test('groups are sorted by resume time ascending', () => {
    const now = Date.now();
    card.hass.states = {
      'sensor.autosnooze_snoozed_automations': {
        attributes: {
          paused_automations: {
            'automation.a': {
              resume_at: new Date(now + 3600000).toISOString(),  // 1 hour
              disable_at: null
            },
            'automation.b': {
              resume_at: new Date(now + 1800000).toISOString(),  // 30 min
              disable_at: null
            },
            'automation.c': {
              resume_at: new Date(now + 7200000).toISOString(),  // 2 hours
              disable_at: null
            },
          }
        }
      }
    };

    const groups = card._getPausedGroupedByResumeTime();

    // Earliest should be first
    const times = groups.map(g => new Date(g.resumeAt).getTime());
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
          }
        }
      }
    };

    const groups = card._getPausedGroupedByResumeTime();
    expect(groups.length).toBe(1);
    expect(groups[0].automations.length).toBe(2);
  });
});

// =============================================================================
// AUTOMATION ID PARSING TESTS
// =============================================================================
describe('Automation ID Parsing Mutations', () => {
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

    const automations = card._getAutomations();
    expect(automations[0].name).toBe('My Automation');
  });

  test('falls back to ID when no friendly_name', () => {
    card.hass.states = {
      'automation.my_auto': { attributes: {} },
    };

    const automations = card._getAutomations();
    expect(automations[0].name).toBe('my_auto');
  });
});

// =============================================================================
// TOGGLE SELECTION TESTS
// =============================================================================
describe('_toggleSelection Array Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card._selected = [];
  });

  test('adds item when not selected', () => {
    card._toggleSelection('automation.a');
    expect(card._selected).toContain('automation.a');
  });

  test('removes item when already selected', () => {
    card._selected = ['automation.a'];
    card._toggleSelection('automation.a');
    expect(card._selected).not.toContain('automation.a');
  });

  test('preserves other selections when toggling', () => {
    card._selected = ['automation.a', 'automation.b'];
    card._toggleSelection('automation.a');
    expect(card._selected).not.toContain('automation.a');
    expect(card._selected).toContain('automation.b');
  });
});

// =============================================================================
// STUB CONFIG TESTS
// =============================================================================
describe('Static Method Mutations', () => {
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
describe('_clearSelection State Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
  });

  test('clears all selected items', () => {
    card._selected = ['automation.a', 'automation.b', 'automation.c'];
    card._clearSelection();
    expect(card._selected.length).toBe(0);
    expect(Array.isArray(card._selected)).toBe(true);
  });

  test('works when already empty', () => {
    card._selected = [];
    card._clearSelection();
    expect(card._selected.length).toBe(0);
  });
});

// =============================================================================
// FILTER TAB TESTS
// =============================================================================
describe('Filter Tab Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
    card._entityRegistry = {};
    card.hass.states = {
      'automation.a': { attributes: { friendly_name: 'A' } },
    };
  });

  test('_filterTab defaults to "all"', () => {
    expect(card._filterTab).toBe('all');
  });

  test('setting _filterTab changes filter', () => {
    card._filterTab = 'areas';
    expect(card._filterTab).toBe('areas');
  });
});

// =============================================================================
// GET PAUSED / SCHEDULED TESTS
// =============================================================================
describe('_getPaused and _getScheduled Fallback Mutations', () => {
  let card;

  beforeEach(() => {
    card = createCard();
  });

  test('_getPaused returns empty object when sensor missing', () => {
    card.hass.states = {};
    const result = card._getPaused();
    expect(result).toEqual({});
  });

  test('_getPaused returns empty object when attribute missing', () => {
    card.hass.states = {
      'sensor.autosnooze_snoozed_automations': { attributes: {} }
    };
    const result = card._getPaused();
    expect(result).toEqual({});
  });

  test('_getScheduled returns empty object when sensor missing', () => {
    card.hass.states = {};
    const result = card._getScheduled();
    expect(result).toEqual({});
  });

  test('_getScheduled returns empty object when attribute missing', () => {
    card.hass.states = {
      'sensor.autosnooze_snoozed_automations': { attributes: {} }
    };
    const result = card._getScheduled();
    expect(result).toEqual({});
  });
});

// =============================================================================
// AUTOMATION CACHE TESTS
// =============================================================================
describe('Automation Cache Mutations', () => {
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
    expect(first).toBe(second);  // Same reference
  });

  test('invalidates cache when states change', () => {
    const first = card._getAutomations();

    // Simulate state change
    card.hass = {
      ...card.hass,
      states: {
        'automation.b': { attributes: { friendly_name: 'B' } },
      }
    };

    const second = card._getAutomations();
    expect(first).not.toBe(second);
  });
});
