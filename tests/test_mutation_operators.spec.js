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

import '../custom_components/autosnooze/www/autosnooze-card.js';

// Helper to query inside the active-pauses child component's shadow DOM
function queryActivePauses(card) {
  return card.shadowRoot?.querySelector('autosnooze-active-pauses');
}
function queryInActivePauses(card, selector) {
  const ap = queryActivePauses(card);
  return ap?.shadowRoot?.querySelector(selector);
}
// Helper to query inside the duration-selector child component's shadow DOM
function queryDurationSelector(card) {
  return card.shadowRoot?.querySelector('autosnooze-duration-selector');
}
function queryInDurationSelector(card, selector) {
  const ds = queryDurationSelector(card);
  return ds?.shadowRoot?.querySelector(selector);
}
import { formatCountdown, parseDurationInput, formatDuration } from '../src/utils/index.js';
import { formatRegistryId } from '../src/state/automations.js';

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
    test('30 minutes equals exactly 1800000 ms', async () => {
      card._handleDurationChange(new CustomEvent('duration-change', {
        detail: { minutes: 30, duration: { days: 0, hours: 0, minutes: 30 }, input: '30m', showCustomInput: false },
      }));
      await card.updateComplete;
      expect(card._duration).toBe(30 * 60 * 1000);
      expect(card._duration).not.toBe(30 + 60 + 1000);
      expect(card._duration).not.toBe(30 - 60 - 1000);
    });

    test('60 minutes equals exactly 3600000 ms', async () => {
      card._handleDurationChange(new CustomEvent('duration-change', {
        detail: { minutes: 60, duration: { days: 0, hours: 1, minutes: 0 }, input: '1h', showCustomInput: false },
      }));
      await card.updateComplete;
      expect(card._duration).toBe(60 * 60 * 1000);
      expect(card._duration).not.toBe(60 / 60 / 1000);
    });

    test('1440 minutes equals exactly 86400000 ms (1 day)', async () => {
      card._handleDurationChange(new CustomEvent('duration-change', {
        detail: { minutes: 1440, duration: { days: 1, hours: 0, minutes: 0 }, input: '1d', showCustomInput: false },
      }));
      await card.updateComplete;
      expect(card._duration).toBe(1440 * 60 * 1000);
    });

    test('240 minutes equals exactly 14400000 ms (4 hours)', async () => {
      card._handleDurationChange(new CustomEvent('duration-change', {
        detail: { minutes: 240, duration: { days: 0, hours: 4, minutes: 0 }, input: '4h', showCustomInput: false },
      }));
      await card.updateComplete;
      expect(card._duration).toBe(240 * 60 * 1000);
    });
  });

  describe('Custom duration calculation', () => {
    test('1d 2h 30m calculates correctly', async () => {
      card._handleDurationChange(new CustomEvent('duration-change', {
        detail: { minutes: 1590, duration: { days: 1, hours: 2, minutes: 30 }, input: '1d2h30m' },
      }));
      await card.updateComplete;
      // (1 * 1440 + 2 * 60 + 30) * 60000
      const expected = (1440 + 120 + 30) * 60000;
      expect(card._duration).toBe(expected);
    });

    test('0d 0h 1m equals 60000 ms', async () => {
      card._handleDurationChange(new CustomEvent('duration-change', {
        detail: { minutes: 1, duration: { days: 0, hours: 0, minutes: 1 }, input: '1m' },
      }));
      await card.updateComplete;
      expect(card._duration).toBe(60000);
    });

    test('0d 1h 0m equals 3600000 ms', async () => {
      card._handleDurationChange(new CustomEvent('duration-change', {
        detail: { minutes: 60, duration: { days: 0, hours: 1, minutes: 0 }, input: '1h' },
      }));
      await card.updateComplete;
      expect(card._duration).toBe(3600000);
    });

    test('1d 0h 0m equals 86400000 ms', async () => {
      card._handleDurationChange(new CustomEvent('duration-change', {
        detail: { minutes: 1440, duration: { days: 1, hours: 0, minutes: 0 }, input: '1d' },
      }));
      await card.updateComplete;
      expect(card._duration).toBe(86400000);
    });
  });

  describe('Countdown calculations', () => {
    test('60 seconds difference shows 1m', () => {
      const future = new Date(Date.now() + 60500).toISOString();
      const result = formatCountdown(future);
      expect(result).toMatch(/1m/);
    });

    test('3600 seconds difference shows 1h', () => {
      const future = new Date(Date.now() + 3600500).toISOString();
      const result = formatCountdown(future);
      expect(result).toMatch(/1h/);
    });

    test('86400 seconds difference shows 1d', () => {
      const future = new Date(Date.now() + 86400500).toISOString();
      const result = formatCountdown(future);
      expect(result).toMatch(/1d/);
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

  describe('Countdown boundary checks', () => {
    test('0 diff returns Resuming...', () => {
      const now = new Date().toISOString();
      expect(formatCountdown(now)).toBe('Resuming...');
    });

    test('negative diff returns Resuming...', () => {
      const past = new Date(Date.now() - 10000).toISOString();
      expect(formatCountdown(past)).toBe('Resuming...');
    });

    test('positive 1ms diff does not return Resuming...', () => {
      const future = new Date(Date.now() + 2000).toISOString();
      expect(formatCountdown(future)).not.toBe('Resuming...');
    });
  });

  describe('Duration format thresholds', () => {
    test('exactly 1 day shows singular', () => {
      expect(formatDuration(1, 0, 0)).toBe('1 day');
    });

    test('exactly 2 days shows plural', () => {
      expect(formatDuration(2, 0, 0)).toBe('2 days');
    });

    test('exactly 1 hour shows singular', () => {
      expect(formatDuration(0, 1, 0)).toBe('1 hour');
    });

    test('exactly 2 hours shows plural', () => {
      expect(formatDuration(0, 2, 0)).toBe('2 hours');
    });

    test('exactly 1 minute shows singular', () => {
      expect(formatDuration(0, 0, 1)).toBe('1 minute');
    });

    test('exactly 2 minutes shows plural', () => {
      expect(formatDuration(0, 0, 2)).toBe('2 minutes');
    });
  });

  describe('Selection length checks', () => {
    test('0 selected means snooze button disabled', async () => {
      card._selected = [];
      await card.updateComplete;
      const btn = card.shadowRoot.querySelector('.snooze-btn');
      expect(btn.disabled).toBe(true);
    });

    test('1 selected means snooze button enabled', async () => {
      card._selected = ['automation.a'];
      await card.updateComplete;
      const btn = card.shadowRoot.querySelector('.snooze-btn');
      expect(btn.disabled).toBe(false);
    });

    test('2 selected still shows enabled', async () => {
      card._selected = ['automation.a', 'automation.b'];
      await card.updateComplete;
      const btn = card.shadowRoot.querySelector('.snooze-btn');
      expect(btn.disabled).toBe(false);
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
      const activePauses = queryActivePauses(card);
      if (activePauses) await activePauses.updateComplete;
      const wakeAll = queryInActivePauses(card, '.wake-all');
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
      const activePauses = queryActivePauses(card);
      if (activePauses) await activePauses.updateComplete;
      const wakeAll = queryInActivePauses(card, '.wake-all');
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
    test('_hasResumeAt requires both date AND time', () => {
      card._resumeAtDate = '2026-01-15';
      card._resumeAtTime = '';
      expect(card._hasResumeAt()).toBeFalsy();

      card._resumeAtDate = '';
      card._resumeAtTime = '12:00';
      expect(card._hasResumeAt()).toBeFalsy();

      card._resumeAtDate = '2026-01-15';
      card._resumeAtTime = '12:00';
      expect(card._hasResumeAt()).toBeTruthy();
    });

    test('_hasDisableAt requires both date AND time', () => {
      card._disableAtDate = '2026-01-15';
      card._disableAtTime = '';
      expect(card._hasDisableAt()).toBeFalsy();

      card._disableAtDate = '';
      card._disableAtTime = '10:00';
      expect(card._hasDisableAt()).toBeFalsy();

      card._disableAtDate = '2026-01-15';
      card._disableAtTime = '10:00';
      expect(card._hasDisableAt()).toBeTruthy();
    });

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
      const ds = queryDurationSelector(card);
      ds.showCustomInput = false;
      await ds.updateComplete;
      const customInput = queryInDurationSelector(card, '.custom-duration-input');
      expect(customInput).toBeNull();
    });

    test('custom input shown when _showCustomInput is true', async () => {
      card._showCustomInput = true;
      await card.updateComplete;
      const ds = queryDurationSelector(card);
      ds.showCustomInput = true;
      await ds.updateComplete;
      const customInput = queryInDurationSelector(card, '.custom-duration-input');
      expect(customInput).not.toBeNull();
    });

    test('schedule mode toggle via child event', async () => {
      card._scheduleMode = false;
      // Simulate schedule-mode-change event (Lit @event bindings don't propagate in jsdom)
      card._handleScheduleModeChange(new CustomEvent('schedule-mode-change', {
        detail: { enabled: true },
      }));
      await card.updateComplete;
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

  describe('Array includes/indexOf', () => {
    test('toggleSelection adds when not present', () => {
      card._selected = ['automation.a'];
      queryAutomationList(card)._toggleSelection('automation.b');
      expect(card._selected).toContain('automation.b');
    });

    test('toggleSelection removes when present', () => {
      card._selected = ['automation.a', 'automation.b'];
      queryAutomationList(card)._toggleSelection('automation.a');
      expect(card._selected).not.toContain('automation.a');
      expect(card._selected).toContain('automation.b');
    });
  });

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

      const grouped = queryAutomationList(card)._getGroupedByArea();
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
      queryAutomationList(card)._toggleSelection('automation.a');
      expect(card._selected.length).toBe(1);
      queryAutomationList(card)._toggleSelection('automation.b');
      expect(card._selected.length).toBe(2);
      queryAutomationList(card)._toggleSelection('automation.a');
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
      const result = formatCountdown(future);
      // 1h 1m 1s
      expect(result).toMatch(/1h 1m 1s/);
    });

    test('duration format joins with comma', () => {
      expect(formatDuration(1, 1, 1)).toBe('1 day, 1 hour, 1 minute');
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
      expect(formatRegistryId('my_area_name')).toBe('My Area Name');
    });

    test('_formatRegistryId capitalizes each word', () => {
      expect(formatRegistryId('living_room')).toBe('Living Room');
    });
  });

  describe('String toLowerCase/toUpperCase', () => {
    test('duration parsing is case insensitive', () => {
      const lower = parseDurationInput('1h30m');
      const upper = parseDurationInput('1H30M');
      expect(lower).toEqual(upper);
    });
  });

  describe('String match/test', () => {
    test('duration regex matches various formats', () => {
      expect(parseDurationInput('1d')).not.toBeNull();
      expect(parseDurationInput('2h')).not.toBeNull();
      expect(parseDurationInput('30m')).not.toBeNull();
      expect(parseDurationInput('1d2h30m')).not.toBeNull();
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

      queryAutomationList(card)._search = 'living';
      await card.updateComplete;

      const visible = queryAutomationList(card)._getFilteredAutomations();
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
      // Simulate custom-input-toggle event (Lit @event bindings don't propagate in jsdom)
      card._handleCustomInputToggle(new CustomEvent('custom-input-toggle', {
        detail: { show: true },
      }));
      await card.updateComplete;
      expect(card._showCustomInput).toBe(true);
    });
  });

  describe('Boolean returns', () => {
    test('_isDurationValid returns true for valid via child', async () => {
      const ds = queryDurationSelector(card);
      await ds.updateComplete;
      ds.customDurationInput = '30m';
      expect(ds._isDurationValid()).toBe(true);
    });

    test('_isDurationValid returns false for invalid via child', async () => {
      const ds = queryDurationSelector(card);
      await ds.updateComplete;
      ds.customDurationInput = 'invalid';
      expect(ds._isDurationValid()).toBe(false);
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
      expect(formatDuration(1, 0, 0)).toBe('1 day');
      expect(formatDuration(2, 0, 0)).toBe('2 days');
    });

    test('1 hour singular, 2 hours plural', () => {
      expect(formatDuration(0, 1, 0)).toBe('1 hour');
      expect(formatDuration(0, 2, 0)).toBe('2 hours');
    });

    test('1 minute singular, 2 minutes plural', () => {
      expect(formatDuration(0, 0, 1)).toBe('1 minute');
      expect(formatDuration(0, 0, 2)).toBe('2 minutes');
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
      expect(typeof formatDuration(1, 0, 0)).toBe('string');
    });

    test('_formatCountdown returns string', () => {
      const future = new Date(Date.now() + 60000).toISOString();
      expect(typeof formatCountdown(future)).toBe('string');
    });

    test('_parseDurationInput returns object or null', () => {
      const valid = parseDurationInput('30m');
      expect(valid).not.toBeNull();
      expect(typeof valid).toBe('object');

      const invalid = parseDurationInput('xyz');
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
      const result = parseDurationInput('1m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 1 });
    });

    test('59 minutes', () => {
      const result = parseDurationInput('59m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 59 });
    });

    test('60 minutes becomes 1h', () => {
      const result = parseDurationInput('60');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 0 });
    });

    test('61 minutes becomes 1h 1m', () => {
      const result = parseDurationInput('61');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 1 });
    });

    test('1439 minutes', () => {
      const result = parseDurationInput('1439');
      expect(result).toEqual({ days: 0, hours: 23, minutes: 59 });
    });

    test('1440 minutes becomes 1d', () => {
      const result = parseDurationInput('1440');
      expect(result).toEqual({ days: 1, hours: 0, minutes: 0 });
    });

    test('1441 minutes becomes 1d 0h 1m', () => {
      const result = parseDurationInput('1441');
      expect(result).toEqual({ days: 1, hours: 0, minutes: 1 });
    });
  });

  describe('Countdown boundaries', () => {
    test('exactly 60 seconds shows minutes', () => {
      const future = new Date(Date.now() + 60500).toISOString();
      const result = formatCountdown(future);
      expect(result).toMatch(/1m/);
    });

    test('59 seconds shows seconds', () => {
      const future = new Date(Date.now() + 59500).toISOString();
      const result = formatCountdown(future);
      expect(result).toMatch(/\d+s/);
    });

    test('exactly 3600 seconds shows hours', () => {
      const future = new Date(Date.now() + 3600500).toISOString();
      const result = formatCountdown(future);
      expect(result).toMatch(/1h/);
    });

    test('exactly 86400 seconds shows days', () => {
      const future = new Date(Date.now() + 86400500).toISOString();
      const result = formatCountdown(future);
      expect(result).toMatch(/1d/);
    });
  });
});
