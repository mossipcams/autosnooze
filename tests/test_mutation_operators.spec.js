/**
 * Mutation Operators Tests
 *
 * Tests specifically designed to detect mutated operators:
 * - Arithmetic: +, -, *, /, %
 * - Comparison: <, <=, >, >=, ==, ===, !=, !==
 * - Logical: &&, ||, !
 * - Increment/Decrement: ++, --
 * - String concatenation
 * - Array/Object mutations
 */

import '../src/index.js';

// =============================================================================
// ARITHMETIC OPERATORS
// =============================================================================

describe('Arithmetic Operator Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Duration to milliseconds conversion', () => {
    test('30 minutes equals exactly 1800000 ms', () => {
      card._setDuration(30);
      expect(card._duration).toBe(30 * 60 * 1000);
      expect(card._duration).not.toBe(30 + 60 + 1000);
      expect(card._duration).not.toBe(30 - 60 - 1000);
    });

    test('60 minutes equals exactly 3600000 ms', () => {
      card._setDuration(60);
      expect(card._duration).toBe(60 * 60 * 1000);
      expect(card._duration).not.toBe(60 / 60 / 1000);
    });

    test('1440 minutes equals exactly 86400000 ms (1 day)', () => {
      card._setDuration(1440);
      expect(card._duration).toBe(1440 * 60 * 1000);
    });

    test('240 minutes equals exactly 14400000 ms (4 hours)', () => {
      card._setDuration(240);
      expect(card._duration).toBe(240 * 60 * 1000);
    });
  });

  describe('Custom duration calculation', () => {
    test('1d 2h 30m calculates correctly', () => {
      card._customDuration = { days: 1, hours: 2, minutes: 30 };
      card._updateCustomDuration();
      // (1 * 1440 + 2 * 60 + 30) * 60000
      const expected = (1440 + 120 + 30) * 60000;
      expect(card._duration).toBe(expected);
    });

    test('0d 0h 1m equals 60000 ms', () => {
      card._customDuration = { days: 0, hours: 0, minutes: 1 };
      card._updateCustomDuration();
      expect(card._duration).toBe(60000);
    });

    test('0d 1h 0m equals 3600000 ms', () => {
      card._customDuration = { days: 0, hours: 1, minutes: 0 };
      card._updateCustomDuration();
      expect(card._duration).toBe(3600000);
    });

    test('1d 0h 0m equals 86400000 ms', () => {
      card._customDuration = { days: 1, hours: 0, minutes: 0 };
      card._updateCustomDuration();
      expect(card._duration).toBe(86400000);
    });
  });

  describe('Countdown calculations', () => {
    test.each([
      [60500, /1m/, '1 minute'],
      [3600500, /1h/, '1 hour'],
      [86400500, /1d/, '1 day'],
    ])('%s ms shows %s', (ms, pattern) => {
      const future = new Date(Date.now() + ms).toISOString();
      expect(card._formatCountdown(future)).toMatch(pattern);
    });
  });

  describe('Card size calculation', () => {
    test('base size plus paused count', () => {
      card.hass = createMockHass({
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '2',
            attributes: {
              paused_automations: { a: {}, b: {} },
              scheduled_snoozes: {},
            },
          },
        },
      });
      // Base 4 + 2 paused = 6
      expect(card.getCardSize()).toBe(6);
    });

    test('base size plus scheduled count', () => {
      card.hass = createMockHass({
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '3',
            attributes: {
              paused_automations: {},
              scheduled_snoozes: { a: {}, b: {}, c: {} },
            },
          },
        },
      });
      // Base 4 + 3 scheduled = 7
      expect(card.getCardSize()).toBe(7);
    });
  });
});

// =============================================================================
// COMPARISON OPERATORS
// =============================================================================

describe('Comparison Operator Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'automation.a': { entity_id: 'automation.a', state: 'on', attributes: { friendly_name: 'A' } },
        'automation.b': { entity_id: 'automation.b', state: 'on', attributes: { friendly_name: 'B' } },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  // Countdown boundary tests consolidated in test_boundary_mutations.spec.js

  describe('Duration format singular/plural', () => {
    test.each([
      [1, 0, 0, '1 day'],
      [2, 0, 0, '2 days'],
      [0, 1, 0, '1 hour'],
      [0, 2, 0, '2 hours'],
      [0, 0, 1, '1 minute'],
      [0, 0, 2, '2 minutes'],
    ])('_formatDuration(%d, %d, %d) = "%s"', (d, h, m, expected) => {
      expect(card._formatDuration(d, h, m)).toBe(expected);
    });
  });

  describe('Selection length checks', () => {
    test.each([
      [[], true, 'disabled when empty'],
      [['automation.a'], false, 'enabled with selection'],
    ])('snooze button is %s', async (selected, expectedDisabled) => {
      card._selected = selected;
      await card.updateComplete;
      const btn = card.shadowRoot.querySelector('.snooze-btn');
      expect(btn.disabled).toBe(expectedDisabled);
    });
  });

  describe('Paused count thresholds', () => {
    test('0 paused hides status summary', async () => {
      await card.updateComplete;
      const summary = card.shadowRoot.querySelector('.status-summary');
      expect(summary).toBeNull();
    });

    test('1 paused shows status summary', async () => {
      card.hass = createMockHass({
        states: {
          'automation.a': { entity_id: 'automation.a', state: 'on', attributes: { friendly_name: 'A' } },
          'sensor.autosnooze_snoozed_automations': {
            state: '1',
            attributes: {
              paused_automations: {
                a: { resume_at: new Date(Date.now() + 3600000).toISOString() },
              },
              scheduled_snoozes: {},
            },
          },
        },
      });
      await card.updateComplete;
      const summary = card.shadowRoot.querySelector('.status-summary');
      expect(summary).not.toBeNull();
    });

    test('1 paused hides Wake All button', async () => {
      card.hass = createMockHass({
        states: {
          'automation.a': { entity_id: 'automation.a', state: 'on', attributes: { friendly_name: 'A' } },
          'sensor.autosnooze_snoozed_automations': {
            state: '1',
            attributes: {
              paused_automations: {
                a: { resume_at: new Date(Date.now() + 3600000).toISOString() },
              },
              scheduled_snoozes: {},
            },
          },
        },
      });
      await card.updateComplete;
      const wakeAll = card.shadowRoot.querySelector('.wake-all');
      expect(wakeAll).toBeNull();
    });

    test('2 paused shows Wake All button', async () => {
      card.hass = createMockHass({
        states: {
          'automation.a': { entity_id: 'automation.a', state: 'on', attributes: { friendly_name: 'A' } },
          'sensor.autosnooze_snoozed_automations': {
            state: '2',
            attributes: {
              paused_automations: {
                a: { resume_at: new Date(Date.now() + 3600000).toISOString() },
                b: { resume_at: new Date(Date.now() + 3600000).toISOString() },
              },
              scheduled_snoozes: {},
            },
          },
        },
      });
      await card.updateComplete;
      const wakeAll = card.shadowRoot.querySelector('.wake-all');
      expect(wakeAll).not.toBeNull();
    });
  });
});

// =============================================================================
// LOGICAL OPERATORS
// =============================================================================

describe('Logical Operator Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('AND conditions (&&)', () => {
    // _hasResumeAt/_hasDisableAt tests consolidated in test_mutation_coverage.spec.js with test.each()

    test('snooze button disabled when loading AND selected', async () => {
      card._selected = ['automation.test'];
      card._loading = true;
      await card.updateComplete;
      const btn = card.shadowRoot.querySelector('.snooze-btn');
      expect(btn.disabled).toBe(true);
    });
  });

  describe('OR conditions (||)', () => {
    test('_getPaused returns empty object when entity missing', () => {
      card.hass = { states: {} };
      expect(card._getPaused()).toEqual({});
    });

    test('_getScheduled returns empty object when entity missing', () => {
      card.hass = { states: {} };
      expect(card._getScheduled()).toEqual({});
    });

    test('_getAutomations returns empty array when no states', () => {
      card.hass = { states: {} };
      card._automationsCache = null;
      expect(card._getAutomations()).toEqual([]);
    });
  });

  describe('NOT conditions (!)', () => {
    test('custom input hidden when _showCustomInput is false', async () => {
      card._showCustomInput = false;
      await card.updateComplete;
      const customInput = card.shadowRoot.querySelector('.custom-duration-input');
      expect(customInput).toBeNull();
    });

    test('custom input shown when _showCustomInput is true', async () => {
      card._showCustomInput = true;
      await card.updateComplete;
      const customInput = card.shadowRoot.querySelector('.custom-duration-input');
      expect(customInput).not.toBeNull();
    });

    test('schedule mode toggle', () => {
      card._scheduleMode = false;
      card._enterScheduleMode();
      expect(card._scheduleMode).toBe(true);
    });
  });
});

// =============================================================================
// ARRAY OPERATIONS
// =============================================================================

describe('Array Operation Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'automation.a': { entity_id: 'automation.a', state: 'on', attributes: { friendly_name: 'A' } },
        'automation.b': { entity_id: 'automation.b', state: 'on', attributes: { friendly_name: 'B' } },
        'automation.c': { entity_id: 'automation.c', state: 'on', attributes: { friendly_name: 'C' } },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  // Array includes/indexOf tests consolidated in test_boundary_mutations.spec.js

  describe('Array filter', () => {
    test('_getAutomations filters to automation entities only', () => {
      card.hass.states['light.test'] = {
        entity_id: 'light.test',
        state: 'on',
        attributes: { friendly_name: 'Light' },
      };
      card._automationsCache = null;
      const automations = card._getAutomations();
      expect(automations.some((a) => a.id === 'light.test')).toBe(false);
    });
  });

  describe('Array map', () => {
    test('_getAutomations maps entity data correctly', () => {
      card._automationsCache = null;
      const automations = card._getAutomations();
      const auto = automations.find((a) => a.id === 'automation.a');
      expect(auto).toBeDefined();
      expect(auto.name).toBe('A');
      expect(auto.id).toBe('automation.a');
    });
  });

  describe('Array sort', () => {
    test('automations sorted by name', () => {
      const automations = card._getAutomations();
      const names = automations.map((a) => a.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sorted);
    });

    test('grouped areas sorted alphabetically', () => {
      card._entityRegistry = {
        'automation.a': { entity_id: 'automation.a', area_id: 'zone_b', labels: [], categories: {} },
        'automation.b': { entity_id: 'automation.b', area_id: 'area_a', labels: [], categories: {} },
      };
      card.hass.areas = {
        zone_b: { name: 'Zone B' },
        area_a: { name: 'Area A' },
      };
      card._entityRegistryFetched = true;
      card._automationsCache = null;

      const grouped = card._getGroupedByArea();
      const names = grouped.map(([name]) => name);
      // Area A should come before Zone B
      expect(names.indexOf('Area A')).toBeLessThan(names.indexOf('Zone B'));
    });
  });

  describe('Array length', () => {
    test('empty selection has length 0', () => {
      card._selected = [];
      expect(card._selected.length).toBe(0);
    });

    test('selection with items has correct length', () => {
      card._selected = ['automation.a', 'automation.b'];
      expect(card._selected.length).toBe(2);
    });
  });

  describe('Array push/splice', () => {
    test('toggleSelection modifies array correctly', () => {
      card._selected = [];
      card._toggleSelection('automation.a');
      expect(card._selected.length).toBe(1);
      card._toggleSelection('automation.b');
      expect(card._selected.length).toBe(2);
      card._toggleSelection('automation.a');
      expect(card._selected.length).toBe(1);
    });
  });
});

// =============================================================================
// STRING OPERATIONS
// =============================================================================

describe('String Operation Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
  });

  describe('String concatenation', () => {
    test('countdown format combines units correctly', () => {
      const future = new Date(Date.now() + 3661500).toISOString();
      const result = card._formatCountdown(future);
      // 1h 1m 1s
      expect(result).toMatch(/1h 1m 1s/);
    });

    test('duration format joins with comma', () => {
      expect(card._formatDuration(1, 1, 1)).toBe('1 day, 1 hour, 1 minute');
    });
  });

  describe('String includes/startsWith', () => {
    test('entity_id startsWith automation.', () => {
      card.hass.states = {
        'automation.test': { entity_id: 'automation.test', state: 'on', attributes: {} },
        'light.test': { entity_id: 'light.test', state: 'on', attributes: {} },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      };
      card._automationsCache = null;
      const automations = card._getAutomations();
      expect(automations.every((a) => a.id.startsWith('automation.'))).toBe(true);
    });
  });

  describe('String replace/split', () => {
    test('_formatRegistryId replaces underscores with spaces', () => {
      expect(card._formatRegistryId('my_area_name')).toBe('My Area Name');
    });

    test('_formatRegistryId capitalizes each word', () => {
      expect(card._formatRegistryId('living_room')).toBe('Living Room');
    });
  });

  describe('String toLowerCase/toUpperCase', () => {
    test('duration parsing is case insensitive', () => {
      const lower = card._parseDurationInput('1h30m');
      const upper = card._parseDurationInput('1H30M');
      expect(lower).toEqual(upper);
    });
  });

  describe('String match/test', () => {
    test('duration regex matches various formats', () => {
      expect(card._parseDurationInput('1d')).not.toBeNull();
      expect(card._parseDurationInput('2h')).not.toBeNull();
      expect(card._parseDurationInput('30m')).not.toBeNull();
      expect(card._parseDurationInput('1d2h30m')).not.toBeNull();
    });

    test('search filters by name match', async () => {
      card.hass = createMockHass({
        states: {
          'automation.living_room': {
            entity_id: 'automation.living_room',
            state: 'on',
            attributes: { friendly_name: 'Living Room' },
          },
          'automation.bedroom': {
            entity_id: 'automation.bedroom',
            state: 'on',
            attributes: { friendly_name: 'Bedroom' },
          },
          'sensor.autosnooze_snoozed_automations': {
            state: '0',
            attributes: { paused_automations: {}, scheduled_snoozes: {} },
          },
        },
      });
      card.setConfig({ title: 'Test' });
      card._automationsCache = null;
      document.body.appendChild(card);
      await card.updateComplete;

      card._search = 'living';
      await card.updateComplete;

      const visible = card._getFilteredAutomations();
      expect(visible.some((a) => a.name.toLowerCase().includes('living'))).toBe(true);

      card.remove();
    });
  });
});

// =============================================================================
// OBJECT OPERATIONS
// =============================================================================

describe('Object Operation Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
  });

  describe('Object.keys', () => {
    test('counts paused correctly', () => {
      card.hass = createMockHass({
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '3',
            attributes: {
              paused_automations: { a: {}, b: {}, c: {} },
              scheduled_snoozes: {},
            },
          },
        },
      });
      expect(Object.keys(card._getPaused()).length).toBe(3);
    });

    test('counts scheduled correctly', () => {
      card.hass = createMockHass({
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '2',
            attributes: {
              paused_automations: {},
              scheduled_snoozes: { a: {}, b: {} },
            },
          },
        },
      });
      expect(Object.keys(card._getScheduled()).length).toBe(2);
    });
  });

  describe('Object property access', () => {
    test('gets entity attributes safely', () => {
      const entity = card.hass.states['sensor.autosnooze_snoozed_automations'];
      expect(entity.attributes.paused_automations).toBeDefined();
      expect(entity.attributes.scheduled_snoozes).toBeDefined();
    });

    test('handles missing attributes gracefully', () => {
      card.hass = { states: {} };
      expect(card._getPaused()).toEqual({});
      expect(card._getScheduled()).toEqual({});
    });
  });

  describe('Object spread', () => {
    test('setConfig merges with defaults', () => {
      card.setConfig({ title: 'Custom Title' });
      expect(card.config.title).toBe('Custom Title');
    });
  });
});

// =============================================================================
// BOOLEAN OPERATIONS
// =============================================================================

describe('Boolean Operation Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Boolean flags', () => {
    test('_loading starts as false', () => {
      expect(card._loading).toBe(false);
    });

    test('_showCustomInput starts as false', () => {
      expect(card._showCustomInput).toBe(false);
    });

    test('_scheduleMode starts as false', () => {
      expect(card._scheduleMode).toBe(false);
    });

    test('_entityRegistryFetched tracks fetch state', () => {
      expect(typeof card._entityRegistryFetched).toBe('boolean');
    });
  });

  describe('Boolean toggle', () => {
    test('clicking custom toggles _showCustomInput', async () => {
      expect(card._showCustomInput).toBe(false);
      const pills = card.shadowRoot.querySelectorAll('.pill');
      const customPill = Array.from(pills).find((p) => p.textContent.includes('Custom'));
      customPill.click();
      await card.updateComplete;
      expect(card._showCustomInput).toBe(true);
    });
  });

  describe('Boolean returns', () => {
    test('_isDurationValid returns true for valid', () => {
      card._customDurationInput = '30m';
      expect(card._isDurationValid()).toBe(true);
    });

    test('_isDurationValid returns false for invalid', () => {
      card._customDurationInput = 'invalid';
      expect(card._isDurationValid()).toBe(false);
    });
  });
});

// =============================================================================
// TERNARY OPERATORS
// =============================================================================

describe('Ternary Operator Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
  });

  describe('Singular vs plural', () => {
    test('1 day singular, 2 days plural', () => {
      expect(card._formatDuration(1, 0, 0)).toBe('1 day');
      expect(card._formatDuration(2, 0, 0)).toBe('2 days');
    });

    test('1 hour singular, 2 hours plural', () => {
      expect(card._formatDuration(0, 1, 0)).toBe('1 hour');
      expect(card._formatDuration(0, 2, 0)).toBe('2 hours');
    });

    test('1 minute singular, 2 minutes plural', () => {
      expect(card._formatDuration(0, 0, 1)).toBe('1 minute');
      expect(card._formatDuration(0, 0, 2)).toBe('2 minutes');
    });
  });

  describe('Conditional text', () => {
    test('snooze button shows count', async () => {
      card.hass.states['automation.test'] = {
        entity_id: 'automation.test',
        state: 'on',
        attributes: { friendly_name: 'Test' },
      };
      document.body.appendChild(card);
      await card.updateComplete;

      card._selected = ['automation.test'];
      await card.updateComplete;

      const btn = card.shadowRoot.querySelector('.snooze-btn');
      expect(btn.textContent).toContain('(1)');

      card.remove();
    });

    test('snooze button shows Snoozing... when loading', async () => {
      card.hass.states['automation.test'] = {
        entity_id: 'automation.test',
        state: 'on',
        attributes: { friendly_name: 'Test' },
      };
      document.body.appendChild(card);
      await card.updateComplete;

      card._selected = ['automation.test'];
      card._loading = true;
      await card.updateComplete;

      const btn = card.shadowRoot.querySelector('.snooze-btn');
      expect(btn.textContent).toContain('Snoozing...');

      card.remove();
    });
  });
});

// =============================================================================
// NULLISH COALESCING
// =============================================================================

describe('Nullish Coalescing Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
  });

  describe('Default values', () => {
    test('_getPaused returns {} when no entity', () => {
      card.hass = { states: {} };
      expect(card._getPaused()).toEqual({});
    });

    test('_getScheduled returns {} when no entity', () => {
      card.hass = { states: {} };
      expect(card._getScheduled()).toEqual({});
    });

    test('config defaults to empty object', () => {
      const CardClass = customElements.get('autosnooze-card');
      const newCard = new CardClass();
      expect(newCard.config).toEqual({});
    });
  });

  describe('Optional chaining', () => {
    test('handles missing hass.states', () => {
      card.hass = {};
      expect(card._getAutomations()).toEqual([]);
    });

    test('handles missing entity attributes', () => {
      card.hass = {
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '0',
          },
        },
      };
      expect(card._getPaused()).toEqual({});
    });

    test('handles missing locale', () => {
      card.hass.locale = null;
      expect(card._getLocale()).toBeUndefined();
    });
  });
});

// =============================================================================
// RETURN VALUE MUTATIONS
// =============================================================================

describe('Return Value Mutations', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Function return values', () => {
    test('getCardSize returns number >= 4', () => {
      expect(card.getCardSize()).toBeGreaterThanOrEqual(4);
    });

    test('_getAutomations returns array', () => {
      expect(Array.isArray(card._getAutomations())).toBe(true);
    });

    test('_getPaused returns object', () => {
      expect(typeof card._getPaused()).toBe('object');
    });

    test('_getScheduled returns object', () => {
      expect(typeof card._getScheduled()).toBe('object');
    });

    test('_formatDuration returns string', () => {
      expect(typeof card._formatDuration(1, 0, 0)).toBe('string');
    });

    test('_formatCountdown returns string', () => {
      const future = new Date(Date.now() + 60000).toISOString();
      expect(typeof card._formatCountdown(future)).toBe('string');
    });

    test('_parseDurationInput returns object or null', () => {
      const valid = card._parseDurationInput('30m');
      expect(valid).not.toBeNull();
      expect(typeof valid).toBe('object');

      const invalid = card._parseDurationInput('xyz');
      expect(invalid).toBeNull();
    });
  });
});

// =============================================================================
// BOUNDARY VALUE TESTS
// =============================================================================

describe('Boundary Value Tests', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });
  });

  describe('Duration boundaries', () => {
    test('minimum 1 minute', () => {
      const result = card._parseDurationInput('1m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 1 });
    });

    test('59 minutes', () => {
      const result = card._parseDurationInput('59m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 59 });
    });

    test('60 minutes becomes 1h', () => {
      const result = card._parseDurationInput('60');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 0 });
    });

    test('61 minutes becomes 1h 1m', () => {
      const result = card._parseDurationInput('61');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 1 });
    });

    test('1439 minutes', () => {
      const result = card._parseDurationInput('1439');
      expect(result).toEqual({ days: 0, hours: 23, minutes: 59 });
    });

    test('1440 minutes becomes 1d', () => {
      const result = card._parseDurationInput('1440');
      expect(result).toEqual({ days: 1, hours: 0, minutes: 0 });
    });

    test('1441 minutes becomes 1d 0h 1m', () => {
      const result = card._parseDurationInput('1441');
      expect(result).toEqual({ days: 1, hours: 0, minutes: 1 });
    });
  });

  describe('Countdown boundaries', () => {
    test('exactly 60 seconds shows minutes', () => {
      const future = new Date(Date.now() + 60500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1m/);
    });

    test('59 seconds shows seconds', () => {
      const future = new Date(Date.now() + 59500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/\d+s/);
    });

    test('exactly 3600 seconds shows hours', () => {
      const future = new Date(Date.now() + 3600500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1h/);
    });

    test('exactly 86400 seconds shows days', () => {
      const future = new Date(Date.now() + 86400500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1d/);
    });
  });
});
