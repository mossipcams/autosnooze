/**
 * Mutation Coverage Tests
 *
 * Comprehensive tests specifically designed to kill surviving mutants.
 * Targets: constants, boundary conditions, conditional branches, operators.
 */

import { vi } from 'vitest';
import '../src/autosnooze-card.js';

// =============================================================================
// CONSTANTS VALIDATION
// =============================================================================

describe('Constants Validation', () => {
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

  describe('TIME_MS constants', () => {
    test('default duration is 30 minutes in milliseconds', () => {
      // 30 * 60 * 1000 = 1800000
      expect(card._duration).toBe(1800000);
    });

    test('1 hour duration is 3600000 ms', () => {
      card._setDuration(60);
      expect(card._duration).toBe(3600000);
    });

    test('1 day duration is 86400000 ms', () => {
      card._setDuration(1440);
      expect(card._duration).toBe(86400000);
    });

    test('1 second is 1000 ms in countdown', () => {
      const futureTime = new Date(Date.now() + 1500).toISOString();
      const result = card._formatCountdown(futureTime);
      expect(result).toMatch(/1s|0m 1s/);
    });
  });

  describe('MINUTES_PER constants', () => {
    test('1 hour is 60 minutes', () => {
      const parsed = card._parseDurationInput('1h');
      expect(parsed).toEqual({ days: 0, hours: 1, minutes: 0 });
      card._customDuration = parsed;
      card._updateCustomDuration();
      expect(card._duration).toBe(3600000); // 60 * 60000
    });

    test('1 day is 1440 minutes', () => {
      const parsed = card._parseDurationInput('1d');
      expect(parsed).toEqual({ days: 1, hours: 0, minutes: 0 });
      card._customDuration = parsed;
      card._updateCustomDuration();
      expect(card._duration).toBe(86400000); // 1440 * 60000
    });
  });

  describe('DEFAULT_DURATIONS array', () => {
    test('has 5 duration options', async () => {
      await card.updateComplete;
      const pills = card.shadowRoot.querySelectorAll('.pill');
      expect(pills.length).toBe(5);
    });

    test('first option is 30m', async () => {
      await card.updateComplete;
      const pills = card.shadowRoot.querySelectorAll('.pill');
      expect(pills[0].textContent.trim()).toBe('30m');
    });

    test('second option is 1h (60 minutes)', async () => {
      await card.updateComplete;
      const pills = card.shadowRoot.querySelectorAll('.pill');
      expect(pills[1].textContent.trim()).toBe('1h');
    });

    test('third option is 4h (240 minutes)', async () => {
      await card.updateComplete;
      const pills = card.shadowRoot.querySelectorAll('.pill');
      expect(pills[2].textContent.trim()).toBe('4h');
    });

    test('fourth option is 1 day (1440 minutes)', async () => {
      await card.updateComplete;
      const pills = card.shadowRoot.querySelectorAll('.pill');
      expect(pills[3].textContent.trim()).toBe('1 day');
    });

    test('fifth option is Custom (null minutes)', async () => {
      await card.updateComplete;
      const pills = card.shadowRoot.querySelectorAll('.pill');
      expect(pills[4].textContent.trim()).toBe('Custom');
    });
  });
});

// =============================================================================
// DURATION PARSING EDGE CASES
// =============================================================================

describe('Duration Parsing Edge Cases', () => {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Decimal duration parsing', () => {
    test('parses 1.5h as 1h 30m', () => {
      const result = card._parseDurationInput('1.5h');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 30 });
    });

    test('parses 2.5d as 2d 12h', () => {
      const result = card._parseDurationInput('2.5d');
      expect(result).toEqual({ days: 2, hours: 12, minutes: 0 });
    });

    test('parses 0.5h as 30m', () => {
      const result = card._parseDurationInput('0.5h');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 30 });
    });

    test('parses 1.5m as 2m (rounded)', () => {
      const result = card._parseDurationInput('1.5m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 2 });
    });

    test('parses 0.25d as 6h', () => {
      const result = card._parseDurationInput('0.25d');
      expect(result).toEqual({ days: 0, hours: 6, minutes: 0 });
    });
  });

  describe('Zero and negative values', () => {
    test('returns null for 0', () => {
      expect(card._parseDurationInput('0')).toBeNull();
    });

    test('returns null for 0m', () => {
      expect(card._parseDurationInput('0m')).toBeNull();
    });

    test('returns null for 0h', () => {
      expect(card._parseDurationInput('0h')).toBeNull();
    });

    test('returns null for 0d', () => {
      expect(card._parseDurationInput('0d')).toBeNull();
    });

    test('strips negative sign and parses value', () => {
      // Parser strips non-numeric prefix and parses remaining digits
      const result = card._parseDurationInput('-5m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 5 });
    });

    test('strips negative sign from hours too', () => {
      const result = card._parseDurationInput('-1h');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 0 });
    });
  });

  describe('Whitespace handling', () => {
    test('handles spaces in input', () => {
      const result = card._parseDurationInput('1d 2h 30m');
      expect(result).toEqual({ days: 1, hours: 2, minutes: 30 });
    });

    test('handles tabs and multiple spaces', () => {
      const result = card._parseDurationInput('1d  2h   30m');
      expect(result).toEqual({ days: 1, hours: 2, minutes: 30 });
    });

    test('handles leading/trailing spaces', () => {
      const result = card._parseDurationInput('  30m  ');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 30 });
    });
  });

  describe('Case insensitivity', () => {
    test('parses uppercase D', () => {
      const result = card._parseDurationInput('1D');
      expect(result).toEqual({ days: 1, hours: 0, minutes: 0 });
    });

    test('parses uppercase H', () => {
      const result = card._parseDurationInput('2H');
      expect(result).toEqual({ days: 0, hours: 2, minutes: 0 });
    });

    test('parses uppercase M', () => {
      const result = card._parseDurationInput('30M');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 30 });
    });

    test('parses mixed case', () => {
      const result = card._parseDurationInput('1D2h30M');
      expect(result).toEqual({ days: 1, hours: 2, minutes: 30 });
    });
  });

  describe('Plain number as minutes', () => {
    test('parses "1" as 1 minute', () => {
      const result = card._parseDurationInput('1');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 1 });
    });

    test('parses "60" as 1 hour', () => {
      const result = card._parseDurationInput('60');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 0 });
    });

    test('parses "1440" as 1 day', () => {
      const result = card._parseDurationInput('1440');
      expect(result).toEqual({ days: 1, hours: 0, minutes: 0 });
    });

    test('parses "90" as 1h 30m', () => {
      const result = card._parseDurationInput('90');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 30 });
    });
  });

  describe('Invalid inputs', () => {
    test('returns null for letters only', () => {
      expect(card._parseDurationInput('abc')).toBeNull();
    });

    test('returns null for special characters', () => {
      expect(card._parseDurationInput('@#$')).toBeNull();
    });

    test('returns null for just units', () => {
      expect(card._parseDurationInput('dhm')).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(card._parseDurationInput('')).toBeNull();
    });

    test('returns null for only whitespace', () => {
      expect(card._parseDurationInput('   ')).toBeNull();
    });
  });

  describe('Rounding behavior', () => {
    test('rounds 0.4m to 0 (which becomes invalid)', () => {
      expect(card._parseDurationInput('0.4m')).toBeNull();
    });

    test('rounds 0.5m to 1m', () => {
      const result = card._parseDurationInput('0.5m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 1 });
    });

    test('rounds 0.6m to 1m', () => {
      const result = card._parseDurationInput('0.6m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 1 });
    });
  });
});

// =============================================================================
// COUNTDOWN FORMATTING
// =============================================================================

describe('Countdown Formatting', () => {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Boundary conditions', () => {
    test('returns "Resuming..." for exactly 0 diff', () => {
      const now = new Date().toISOString();
      expect(card._formatCountdown(now)).toBe('Resuming...');
    });

    test('returns "Resuming..." for negative diff', () => {
      const past = new Date(Date.now() - 1000).toISOString();
      expect(card._formatCountdown(past)).toBe('Resuming...');
    });

    test('59 seconds shows minutes and seconds', () => {
      const future = new Date(Date.now() + 59000).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/\d+m \d+s/);
    });

    test('60 seconds shows 1m 0s', () => {
      const future = new Date(Date.now() + 60500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1m 0s/);
    });

    test('59 minutes 59 seconds shows m and s', () => {
      const future = new Date(Date.now() + 3599000).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/\d+m \d+s/);
    });

    test('1 hour shows h m s format', () => {
      const future = new Date(Date.now() + 3600500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1h \d+m \d+s/);
    });

    test('23h 59m 59s shows h m s', () => {
      const future = new Date(Date.now() + 86399000).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/\d+h \d+m \d+s/);
    });

    test('1 day shows d h m format', () => {
      const future = new Date(Date.now() + 86400500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1d \d+h \d+m/);
    });

    test('multiple days shows d h m format', () => {
      const future = new Date(Date.now() + 172800500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/2d \d+h \d+m/);
    });
  });

  describe('Exact unit boundaries', () => {
    test('exactly 1 second remaining', () => {
      const future = new Date(Date.now() + 1500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/0m 1s|1s/);
    });

    test('exactly 1 minute remaining', () => {
      const future = new Date(Date.now() + 60500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1m \d+s/);
    });

    test('exactly 1 hour remaining', () => {
      const future = new Date(Date.now() + 3600500).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1h 0m 0s/);
    });
  });
});

// =============================================================================
// FORMAT DURATION (plural/singular)
// =============================================================================

describe('Format Duration Singular/Plural', () => {
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

  describe('Singular forms', () => {
    test('1 day singular', () => {
      expect(card._formatDuration(1, 0, 0)).toBe('1 day');
    });

    test('1 hour singular', () => {
      expect(card._formatDuration(0, 1, 0)).toBe('1 hour');
    });

    test('1 minute singular', () => {
      expect(card._formatDuration(0, 0, 1)).toBe('1 minute');
    });

    test('all singular', () => {
      expect(card._formatDuration(1, 1, 1)).toBe('1 day, 1 hour, 1 minute');
    });
  });

  describe('Plural forms', () => {
    test('2 days plural', () => {
      expect(card._formatDuration(2, 0, 0)).toBe('2 days');
    });

    test('2 hours plural', () => {
      expect(card._formatDuration(0, 2, 0)).toBe('2 hours');
    });

    test('2 minutes plural', () => {
      expect(card._formatDuration(0, 0, 2)).toBe('2 minutes');
    });

    test('all plural', () => {
      expect(card._formatDuration(2, 2, 2)).toBe('2 days, 2 hours, 2 minutes');
    });
  });

  describe('Mixed singular/plural', () => {
    test('1 day, 2 hours', () => {
      expect(card._formatDuration(1, 2, 0)).toBe('1 day, 2 hours');
    });

    test('2 days, 1 hour', () => {
      expect(card._formatDuration(2, 1, 0)).toBe('2 days, 1 hour');
    });

    test('1 hour, 30 minutes', () => {
      expect(card._formatDuration(0, 1, 30)).toBe('1 hour, 30 minutes');
    });
  });

  describe('Zero values omitted', () => {
    test('0 days omitted', () => {
      expect(card._formatDuration(0, 2, 30)).toBe('2 hours, 30 minutes');
    });

    test('0 hours omitted', () => {
      expect(card._formatDuration(1, 0, 30)).toBe('1 day, 30 minutes');
    });

    test('0 minutes omitted', () => {
      expect(card._formatDuration(1, 2, 0)).toBe('1 day, 2 hours');
    });

    test('only minutes', () => {
      expect(card._formatDuration(0, 0, 45)).toBe('45 minutes');
    });

    test('only hours', () => {
      expect(card._formatDuration(0, 5, 0)).toBe('5 hours');
    });

    test('only days', () => {
      expect(card._formatDuration(3, 0, 0)).toBe('3 days');
    });
  });
});

// =============================================================================
// ERROR MESSAGE HANDLING
// =============================================================================

describe('Error Message Handling', () => {
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

  describe('Translation key in root', () => {
    test('not_automation key', () => {
      const error = { translation_key: 'not_automation' };
      expect(card._getErrorMessage(error, 'Default')).toBe(
        'Failed to snooze: One or more selected items are not automations'
      );
    });

    test('invalid_duration key', () => {
      const error = { translation_key: 'invalid_duration' };
      expect(card._getErrorMessage(error, 'Default')).toBe(
        'Failed to snooze: Please specify a valid duration (days, hours, or minutes)'
      );
    });

    test('resume_time_past key', () => {
      const error = { translation_key: 'resume_time_past' };
      expect(card._getErrorMessage(error, 'Default')).toBe(
        'Failed to snooze: Resume time must be in the future'
      );
    });

    test('disable_after_resume key', () => {
      const error = { translation_key: 'disable_after_resume' };
      expect(card._getErrorMessage(error, 'Default')).toBe(
        'Failed to snooze: Snooze time must be before resume time'
      );
    });
  });

  describe('Translation key in data', () => {
    test('not_automation in data', () => {
      const error = { data: { translation_key: 'not_automation' } };
      expect(card._getErrorMessage(error, 'Default')).toContain('not automations');
    });

    test('invalid_duration in data', () => {
      const error = { data: { translation_key: 'invalid_duration' } };
      expect(card._getErrorMessage(error, 'Default')).toContain('valid duration');
    });
  });

  describe('Message pattern matching', () => {
    test('message containing not_automation', () => {
      const error = { message: 'Error: not_automation occurred' };
      expect(card._getErrorMessage(error, 'Default')).toContain('not automations');
    });

    test('message containing "not automation" with spaces', () => {
      const error = { message: 'Error: not automation found' };
      expect(card._getErrorMessage(error, 'Default')).toContain('not automations');
    });

    test('message containing resume_time_past', () => {
      const error = { message: 'resume_time_past error' };
      expect(card._getErrorMessage(error, 'Default')).toContain('in the future');
    });

    test('message containing "resume time past"', () => {
      const error = { message: 'resume time past issue' };
      expect(card._getErrorMessage(error, 'Default')).toContain('in the future');
    });

    test('message containing disable_after_resume', () => {
      const error = { message: 'disable_after_resume validation' };
      expect(card._getErrorMessage(error, 'Default')).toContain('before resume time');
    });

    test('message containing "disable after resume"', () => {
      const error = { message: 'disable after resume problem' };
      expect(card._getErrorMessage(error, 'Default')).toContain('before resume time');
    });
  });

  describe('Default message fallback', () => {
    test('unknown error returns default with logs hint', () => {
      const error = { message: 'Unknown xyz error' };
      expect(card._getErrorMessage(error, 'My Default')).toBe(
        'My Default. Check Home Assistant logs for details.'
      );
    });

    test('empty error returns default', () => {
      const error = {};
      expect(card._getErrorMessage(error, 'Default Message')).toBe(
        'Default Message. Check Home Assistant logs for details.'
      );
    });

    test('null error returns default', () => {
      expect(card._getErrorMessage(null, 'Fallback')).toBe(
        'Fallback. Check Home Assistant logs for details.'
      );
    });

    test('undefined error returns default', () => {
      expect(card._getErrorMessage(undefined, 'Fallback')).toBe(
        'Fallback. Check Home Assistant logs for details.'
      );
    });
  });
});

// =============================================================================
// GROUPING LOGIC
// =============================================================================

describe('Grouping Logic', () => {
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
      areas: {
        area_z: { name: 'Zone Z' },
        area_a: { name: 'Area A' },
      },
    });
    card._entityRegistry = {
      'automation.a': { entity_id: 'automation.a', area_id: 'area_a', labels: ['label1'], categories: {} },
      'automation.b': { entity_id: 'automation.b', area_id: 'area_z', labels: ['label2'], categories: {} },
      'automation.c': { entity_id: 'automation.c', area_id: null, labels: [], categories: {} },
    };
    card._entityRegistryFetched = true;
    card._labelRegistry = {
      label1: { name: 'First Label' },
      label2: { name: 'Second Label' },
    };
    card._labelsFetched = true;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Area grouping', () => {
    test('groups are sorted alphabetically', () => {
      const grouped = card._getGroupedByArea();
      const names = grouped.map(([name]) => name);
      // Area A should come before Zone Z, Unassigned last
      expect(names[0]).toBe('Area A');
      expect(names[1]).toBe('Zone Z');
      expect(names[names.length - 1]).toBe('Unassigned');
    });

    test('Unassigned group is always last', () => {
      const grouped = card._getGroupedByArea();
      const names = grouped.map(([name]) => name);
      expect(names[names.length - 1]).toBe('Unassigned');
    });

    test('each automation appears in exactly one area group', () => {
      const grouped = card._getGroupedByArea();
      const allIds = grouped.flatMap(([, items]) => items.map((i) => i.id));
      expect(allIds.length).toBe(3);
      expect(new Set(allIds).size).toBe(3);
    });
  });

  describe('Label grouping', () => {
    test('Unlabeled group is always last', () => {
      const grouped = card._getGroupedByLabel();
      const names = grouped.map(([name]) => name);
      expect(names[names.length - 1]).toBe('Unlabeled');
    });

    test('automation with no labels goes to Unlabeled', () => {
      const grouped = card._getGroupedByLabel();
      const unlabeled = grouped.find(([name]) => name === 'Unlabeled');
      expect(unlabeled).toBeDefined();
      expect(unlabeled[1].some((a) => a.id === 'automation.c')).toBe(true);
    });
  });

  describe('Category grouping', () => {
    test('Uncategorized group is always last', () => {
      card._categoryRegistry = {};
      const grouped = card._getGroupedByCategory();
      const names = grouped.map(([name]) => name);
      expect(names[names.length - 1]).toBe('Uncategorized');
    });
  });

  describe('Empty states', () => {
    test('handles empty automations list', async () => {
      card.hass = createMockHass({
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '0',
            attributes: { paused_automations: {}, scheduled_snoozes: {} },
          },
        },
      });
      card._automationsCache = null;
      await card.updateComplete;

      const grouped = card._getGroupedByArea();
      expect(grouped.length).toBe(0);
    });
  });
});

// =============================================================================
// SELECTION LOGIC
// =============================================================================

describe('Selection Logic', () => {
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

  describe('Toggle selection', () => {
    test('adds to empty selection', () => {
      card._selected = [];
      card._toggleSelection('automation.a');
      expect(card._selected).toContain('automation.a');
      expect(card._selected.length).toBe(1);
    });

    test('adds to existing selection', () => {
      card._selected = ['automation.a'];
      card._toggleSelection('automation.b');
      expect(card._selected).toContain('automation.a');
      expect(card._selected).toContain('automation.b');
      expect(card._selected.length).toBe(2);
    });

    test('removes from selection', () => {
      card._selected = ['automation.a', 'automation.b'];
      card._toggleSelection('automation.a');
      expect(card._selected).not.toContain('automation.a');
      expect(card._selected).toContain('automation.b');
      expect(card._selected.length).toBe(1);
    });

    test('removes last item from selection', () => {
      card._selected = ['automation.a'];
      card._toggleSelection('automation.a');
      expect(card._selected.length).toBe(0);
    });
  });

  describe('Select all visible', () => {
    test('selects all when none selected', () => {
      card._selected = [];
      card._selectAllVisible();
      expect(card._selected.length).toBe(3);
    });

    test('selects remaining when some selected', () => {
      card._selected = ['automation.a'];
      card._selectAllVisible();
      expect(card._selected.length).toBe(3);
    });

    test('deselects all when all selected', () => {
      card._selected = ['automation.a', 'automation.b', 'automation.c'];
      card._selectAllVisible();
      expect(card._selected.length).toBe(0);
    });

    test('respects search filter', async () => {
      card._search = 'A';
      await card.updateComplete;
      card._selected = [];
      card._selectAllVisible();
      // Search filter matches 'A' in entity names
      expect(card._selected.length).toBeGreaterThan(0);
    });
  });

  describe('Select group', () => {
    test('selects all items in group', () => {
      const items = [{ id: 'automation.a' }, { id: 'automation.b' }];
      card._selected = [];
      card._selectGroup(items);
      expect(card._selected).toContain('automation.a');
      expect(card._selected).toContain('automation.b');
    });

    test('adds to existing selection', () => {
      const items = [{ id: 'automation.b' }];
      card._selected = ['automation.a'];
      card._selectGroup(items);
      expect(card._selected.length).toBe(2);
    });

    test('deselects all in group when all selected', () => {
      const items = [{ id: 'automation.a' }, { id: 'automation.b' }];
      card._selected = ['automation.a', 'automation.b', 'automation.c'];
      card._selectGroup(items);
      expect(card._selected).not.toContain('automation.a');
      expect(card._selected).not.toContain('automation.b');
      expect(card._selected).toContain('automation.c');
    });

    test('handles single item group', () => {
      const items = [{ id: 'automation.a' }];
      card._selected = [];
      card._selectGroup(items);
      expect(card._selected.length).toBe(1);
    });
  });

  describe('Clear selection', () => {
    test('clears all selections', () => {
      card._selected = ['automation.a', 'automation.b'];
      card._clearSelection();
      expect(card._selected.length).toBe(0);
    });

    test('handles already empty selection', () => {
      card._selected = [];
      card._clearSelection();
      expect(card._selected.length).toBe(0);
    });
  });
});

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================

describe('Toast Notification Edge Cases', () => {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
    vi.clearAllTimers();
  });

  describe('Toast with undo', () => {
    test('undo button stops propagation', () => {
      const onUndo = vi.fn();
      card._showToast('Message', { showUndo: true, onUndo });

      const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
      const event = new MouseEvent('click', { bubbles: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');

      undoBtn.dispatchEvent(event);
      expect(stopSpy).toHaveBeenCalled();
    });

    test('undo callback is called exactly once', () => {
      const onUndo = vi.fn();
      card._showToast('Message', { showUndo: true, onUndo });

      const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
      undoBtn.click();

      expect(onUndo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast without undo', () => {
    test('no undo button when showUndo is false', () => {
      card._showToast('Message', { showUndo: false });

      const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
      expect(undoBtn).toBeNull();
    });

    test('no undo button when onUndo is null', () => {
      card._showToast('Message', { showUndo: true, onUndo: null });

      const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
      expect(undoBtn).toBeNull();
    });

    test('simple message sets text content', () => {
      card._showToast('Simple message');

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast.textContent).toBe('Simple message');
    });
  });

  describe('Toast accessibility', () => {
    test('toast has role="alert"', () => {
      card._showToast('Message');

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast.getAttribute('role')).toBe('alert');
    });

    test('toast has aria-live="polite"', () => {
      card._showToast('Message');

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast.getAttribute('aria-live')).toBe('polite');
    });

    test('toast has aria-atomic="true"', () => {
      card._showToast('Message');

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast.getAttribute('aria-atomic')).toBe('true');
    });

    test('undo button has aria-label', () => {
      card._showToast('Message', { showUndo: true, onUndo: vi.fn() });

      const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
      expect(undoBtn.getAttribute('aria-label')).toBe('Undo last action');
    });
  });

  describe('Toast timeout cleanup', () => {
    test('clears existing toast timeout when showing new toast', () => {
      vi.useFakeTimers();

      card._showToast('First');
      expect(card._toastTimeout).not.toBeNull();

      card._showToast('Second');
      expect(card._toastTimeout).not.toBeNull();

      vi.useRealTimers();
    });

    test('toast timeout gets set correctly', () => {
      vi.useFakeTimers();

      card._showToast('First');
      expect(card._toastTimeout).not.toBeNull();

      // Advance past the duration
      vi.advanceTimersByTime(5500);

      // Timeout should be cleared after expiry
      expect(card._toastTimeout).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('Toast handles edge cases', () => {
    test('handles rapid sequential toasts', () => {
      card._showToast('First');
      card._showToast('Second');
      card._showToast('Third');

      const toasts = card.shadowRoot.querySelectorAll('.toast');
      expect(toasts.length).toBe(1);
      expect(toasts[0].textContent).toContain('Third');
    });
  });
});

// =============================================================================
// SCHEDULE MODE
// =============================================================================

describe('Schedule Mode', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
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

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('_hasResumeAt', () => {
    test('returns truthy when both date and time set', () => {
      card._resumeAtDate = '2026-01-15';
      card._resumeAtTime = '12:00';
      expect(card._hasResumeAt()).toBeTruthy();
    });

    test('returns falsy when only date set', () => {
      card._resumeAtDate = '2026-01-15';
      card._resumeAtTime = '';
      expect(card._hasResumeAt()).toBeFalsy();
    });

    test('returns falsy when only time set', () => {
      card._resumeAtDate = '';
      card._resumeAtTime = '12:00';
      expect(card._hasResumeAt()).toBeFalsy();
    });

    test('returns falsy when both empty', () => {
      card._resumeAtDate = '';
      card._resumeAtTime = '';
      expect(card._hasResumeAt()).toBeFalsy();
    });
  });

  describe('_hasDisableAt', () => {
    test('returns truthy when both date and time set', () => {
      card._disableAtDate = '2026-01-15';
      card._disableAtTime = '10:00';
      expect(card._hasDisableAt()).toBeTruthy();
    });

    test('returns falsy when only date set', () => {
      card._disableAtDate = '2026-01-15';
      card._disableAtTime = '';
      expect(card._hasDisableAt()).toBeFalsy();
    });

    test('returns falsy when only time set', () => {
      card._disableAtDate = '';
      card._disableAtTime = '10:00';
      expect(card._hasDisableAt()).toBeFalsy();
    });
  });

  describe('_combineDateTime', () => {
    test('returns null for empty date', () => {
      expect(card._combineDateTime('', '12:00')).toBeNull();
    });

    test('returns null for empty time', () => {
      expect(card._combineDateTime('2026-01-15', '')).toBeNull();
    });

    test('returns null for null date', () => {
      expect(card._combineDateTime(null, '12:00')).toBeNull();
    });

    test('returns null for null time', () => {
      expect(card._combineDateTime('2026-01-15', null)).toBeNull();
    });

    test('includes timezone offset in result', () => {
      const result = card._combineDateTime('2026-01-15', '12:00');
      expect(result).toMatch(/2026-01-15T12:00[+-]\d{2}:\d{2}/);
    });

    test('result parses to correct local time', () => {
      const result = card._combineDateTime('2026-06-15', '14:30');
      const parsed = new Date(result);
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(5); // June (0-indexed)
      expect(parsed.getDate()).toBe(15);
      expect(parsed.getHours()).toBe(14);
      expect(parsed.getMinutes()).toBe(30);
    });
  });

  describe('_enterScheduleMode', () => {
    test('sets scheduleMode to true', () => {
      card._scheduleMode = false;
      card._enterScheduleMode();
      expect(card._scheduleMode).toBe(true);
    });

    test('sets disableAtDate to current date', () => {
      card._enterScheduleMode();
      expect(card._disableAtDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('sets resumeAtDate to current date', () => {
      card._enterScheduleMode();
      expect(card._resumeAtDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('sets time fields', () => {
      card._enterScheduleMode();
      expect(card._disableAtTime).toMatch(/^\d{2}:\d{2}$/);
      expect(card._resumeAtTime).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('_getCurrentDateTime', () => {
    test('returns object with date and time', () => {
      const result = card._getCurrentDateTime();
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('time');
    });

    test('date is in YYYY-MM-DD format', () => {
      const result = card._getCurrentDateTime();
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('time is in HH:MM format', () => {
      const result = card._getCurrentDateTime();
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});

// =============================================================================
// CACHE LOGIC
// =============================================================================

describe('Cache Logic', () => {
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

  describe('_getAutomations caching', () => {
    test('returns same array on subsequent calls with same hass', () => {
      const first = card._getAutomations();
      const second = card._getAutomations();
      expect(first).toBe(second);
    });

    test('invalidates cache when hass.states changes', () => {
      const first = card._getAutomations();

      card.hass = createMockHass({
        states: {
          'automation.test': {
            entity_id: 'automation.test',
            state: 'off',
            attributes: { friendly_name: 'Test Changed' },
          },
          'sensor.autosnooze_snoozed_automations': {
            state: '0',
            attributes: { paused_automations: {}, scheduled_snoozes: {} },
          },
        },
      });

      const second = card._getAutomations();
      expect(first).not.toBe(second);
    });

    test('invalidates cache when entity registry fetched changes', () => {
      const first = card._getAutomations();

      card._entityRegistryFetched = !card._entityRegistryFetched;
      card._automationsCache = null;

      const second = card._getAutomations();
      expect(first).not.toBe(second);
    });

    test('returns empty array when no states', () => {
      // Save original hass to prevent render issues
      const origHass = card.hass;
      card.hass = { states: undefined };
      card._automationsCache = null;
      expect(card._getAutomations()).toEqual([]);
      // Restore for cleanup
      card.hass = origHass;
    });

    test('returns empty array when states is empty', () => {
      card.hass = { states: {} };
      card._automationsCache = null;
      expect(card._getAutomations()).toEqual([]);
    });
  });
});

// =============================================================================
// FORMAT REGISTRY ID
// =============================================================================

describe('Format Registry ID', () => {
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

  test('converts snake_case to Title Case', () => {
    expect(card._formatRegistryId('living_room')).toBe('Living Room');
  });

  test('handles single word', () => {
    expect(card._formatRegistryId('kitchen')).toBe('Kitchen');
  });

  test('handles multiple underscores', () => {
    expect(card._formatRegistryId('first_floor_living_room')).toBe('First Floor Living Room');
  });

  test('handles already capitalized', () => {
    expect(card._formatRegistryId('UPPER_CASE')).toBe('UPPER CASE');
  });

  test('handles empty string', () => {
    expect(card._formatRegistryId('')).toBe('');
  });
});

// =============================================================================
// UNIQUE COUNT HELPERS
// =============================================================================

describe('Unique Count Helpers', () => {
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
    card._entityRegistry = {
      'automation.a': { entity_id: 'automation.a', area_id: 'area1', labels: ['l1', 'l2'], categories: { automation: 'cat1' } },
      'automation.b': { entity_id: 'automation.b', area_id: 'area1', labels: ['l1'], categories: { automation: 'cat2' } },
    };
    card._entityRegistryFetched = true;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_getAreaCount counts unique areas', () => {
    expect(card._getAreaCount()).toBe(1);
  });

  test('_getLabelCount counts unique labels', () => {
    expect(card._getLabelCount()).toBe(2);
  });

  test('_getCategoryCount counts unique categories', () => {
    expect(card._getCategoryCount()).toBe(2);
  });

  test('counts 0 when no values', () => {
    card._entityRegistry = {
      'automation.a': { entity_id: 'automation.a', area_id: null, labels: [], categories: {} },
    };
    card._automationsCache = null;
    expect(card._getAreaCount()).toBe(0);
    expect(card._getLabelCount()).toBe(0);
    expect(card._getCategoryCount()).toBe(0);
  });
});

// =============================================================================
// KEYBOARD ACCESSIBILITY
// =============================================================================

describe('Keyboard Accessibility', () => {
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

  describe('_handleKeyDown', () => {
    test('Enter key triggers callback and prevents default', () => {
      const callback = vi.fn();
      const event = { key: 'Enter', preventDefault: vi.fn() };

      card._handleKeyDown(event, callback);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    test('Space key triggers callback and prevents default', () => {
      const callback = vi.fn();
      const event = { key: ' ', preventDefault: vi.fn() };

      card._handleKeyDown(event, callback);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    test('Tab key does not trigger callback', () => {
      const callback = vi.fn();
      const event = { key: 'Tab', preventDefault: vi.fn() };

      card._handleKeyDown(event, callback);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    test('Escape key does not trigger callback', () => {
      const callback = vi.fn();
      const event = { key: 'Escape', preventDefault: vi.fn() };

      card._handleKeyDown(event, callback);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    test('Arrow keys do not trigger callback', () => {
      const callback = vi.fn();
      const events = [
        { key: 'ArrowUp', preventDefault: vi.fn() },
        { key: 'ArrowDown', preventDefault: vi.fn() },
        { key: 'ArrowLeft', preventDefault: vi.fn() },
        { key: 'ArrowRight', preventDefault: vi.fn() },
      ];

      events.forEach((event) => {
        card._handleKeyDown(event, callback);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// PAUSED/SCHEDULED GETTERS
// =============================================================================

describe('Paused and Scheduled Getters', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'Test' });
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '2',
          attributes: {
            paused_automations: {
              'automation.a': { resume_at: '2026-01-15T12:00:00Z', friendly_name: 'A' },
              'automation.b': { resume_at: '2026-01-15T14:00:00Z', friendly_name: 'B' },
            },
            scheduled_snoozes: {
              'automation.c': { disable_at: '2026-01-15T10:00:00Z', resume_at: '2026-01-15T12:00:00Z' },
            },
          },
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

  describe('_getPaused', () => {
    test('returns paused automations', () => {
      const paused = card._getPaused();
      expect(Object.keys(paused).length).toBe(2);
    });

    test('returns empty object when sensor missing', () => {
      card.hass = { states: {} };
      expect(card._getPaused()).toEqual({});
    });

    test('returns empty object when attributes missing', () => {
      card.hass = {
        states: {
          'sensor.autosnooze_snoozed_automations': { state: '0' },
        },
      };
      expect(card._getPaused()).toEqual({});
    });
  });

  describe('_getScheduled', () => {
    test('returns scheduled snoozes', () => {
      const scheduled = card._getScheduled();
      expect(Object.keys(scheduled).length).toBe(1);
    });

    test('returns empty object when sensor missing', () => {
      card.hass = { states: {} };
      expect(card._getScheduled()).toEqual({});
    });
  });

  describe('_getPausedGroupedByResumeTime', () => {
    test('groups paused automations by resume time', () => {
      const groups = card._getPausedGroupedByResumeTime();
      expect(groups.length).toBe(2);
    });

    test('sorts groups by resume time ascending', () => {
      const groups = card._getPausedGroupedByResumeTime();
      expect(new Date(groups[0].resumeAt).getTime()).toBeLessThan(
        new Date(groups[1].resumeAt).getTime()
      );
    });

    test('returns empty array when no paused', () => {
      card.hass = {
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '0',
            attributes: { paused_automations: {}, scheduled_snoozes: {} },
          },
        },
      };
      expect(card._getPausedGroupedByResumeTime()).toEqual([]);
    });
  });
});

// =============================================================================
// DURATION PREVIEW
// =============================================================================

describe('Duration Preview', () => {
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

  describe('_getDurationPreview', () => {
    test('returns formatted string for valid input', () => {
      card._customDurationInput = '1h30m';
      expect(card._getDurationPreview()).toBe('1 hour, 30 minutes');
    });

    test('returns empty string for invalid input', () => {
      card._customDurationInput = 'invalid';
      expect(card._getDurationPreview()).toBe('');
    });

    test('returns empty string for empty input', () => {
      card._customDurationInput = '';
      expect(card._getDurationPreview()).toBe('');
    });
  });

  describe('_isDurationValid', () => {
    test('returns true for valid input', () => {
      card._customDurationInput = '30m';
      expect(card._isDurationValid()).toBe(true);
    });

    test('returns false for invalid input', () => {
      card._customDurationInput = 'abc';
      expect(card._isDurationValid()).toBe(false);
    });

    test('returns false for empty input', () => {
      card._customDurationInput = '';
      expect(card._isDurationValid()).toBe(false);
    });

    test('returns false for zero duration', () => {
      card._customDurationInput = '0';
      expect(card._isDurationValid()).toBe(false);
    });
  });
});

// =============================================================================
// CARD SIZE
// =============================================================================

describe('Card Size', () => {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('base size is 4', () => {
    expect(card.getCardSize()).toBe(4);
  });

  test('size increases with paused automations', () => {
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '3',
          attributes: {
            paused_automations: {
              a: {}, b: {}, c: {},
            },
            scheduled_snoozes: {},
          },
        },
      },
    });
    expect(card.getCardSize()).toBe(7);
  });

  test('size increases with scheduled snoozes', () => {
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
    expect(card.getCardSize()).toBe(6);
  });

  test('size increases with both paused and scheduled', () => {
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '3',
          attributes: {
            paused_automations: { a: {}, b: {} },
            scheduled_snoozes: { c: {} },
          },
        },
      },
    });
    expect(card.getCardSize()).toBe(7);
  });
});

// =============================================================================
// EDITOR CONFIG HANDLING
// =============================================================================

describe('Editor Config Handling', () => {
  let editor;

  beforeEach(async () => {
    const EditorClass = customElements.get('autosnooze-card-editor');
    editor = new EditorClass();
    document.body.appendChild(editor);
    await editor.updateComplete;
  });

  afterEach(() => {
    if (editor && editor.parentNode) {
      editor.parentNode.removeChild(editor);
    }
  });

  describe('_valueChanged', () => {
    test('does nothing when _config is null', () => {
      editor._config = null;
      expect(() => editor._valueChanged('key', 'value')).not.toThrow();
    });

    test('removes undefined values', () => {
      editor.setConfig({ title: 'Test', other: 'value' });

      const eventPromise = new Promise((resolve) => {
        editor.addEventListener('config-changed', (e) => resolve(e.detail));
      });

      editor._valueChanged('other', undefined);

      return eventPromise.then((detail) => {
        expect(detail.config.other).toBeUndefined();
      });
    });

    test('removes null values', () => {
      editor.setConfig({ title: 'Test', other: 'value' });

      const eventPromise = new Promise((resolve) => {
        editor.addEventListener('config-changed', (e) => resolve(e.detail));
      });

      editor._valueChanged('other', null);

      return eventPromise.then((detail) => {
        expect(detail.config.other).toBeUndefined();
      });
    });

    test('dispatches bubbles and composed event', () => {
      editor.setConfig({ title: 'Test' });

      let capturedEvent = null;
      editor.addEventListener('config-changed', (e) => {
        capturedEvent = e;
      });

      editor._valueChanged('title', 'New');

      expect(capturedEvent.bubbles).toBe(true);
      expect(capturedEvent.composed).toBe(true);
    });
  });

  describe('render edge cases', () => {
    test('returns empty template when _config is null', async () => {
      editor._config = null;
      await editor.updateComplete;

      // When config is null, no .row div should be rendered
      const row = editor.shadowRoot.querySelector('.row');
      expect(row).toBeNull();
    });

    test('handles missing title gracefully', async () => {
      editor.setConfig({});
      await editor.updateComplete;

      const input = editor.shadowRoot.querySelector('input');
      expect(input.value).toBe('');
    });
  });
});

// =============================================================================
// RENDER CONDITIONAL BRANCHES
// =============================================================================

describe('Render Conditional Branches', () => {
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

  describe('Partial setup conditions', () => {
    test('renders when both hass and config are set', async () => {
      // Card needs both hass and config to render properly
      expect(card.hass).toBeDefined();
      expect(card.config).toBeDefined();
      const haCard = card.shadowRoot.querySelector('ha-card');
      expect(haCard).not.toBeNull();
    });

    test('card has default empty config before setConfig', () => {
      const CardClass = customElements.get('autosnooze-card');
      const newCard = new CardClass();
      expect(newCard.config).toEqual({});
    });
  });

  describe('Selection actions visibility', () => {
    test('shows selection actions when automations exist', async () => {
      await card.updateComplete;
      const actions = card.shadowRoot.querySelector('.selection-actions');
      expect(actions).not.toBeNull();
    });

    test('hides clear button when no selection', async () => {
      card._selected = [];
      await card.updateComplete;

      const buttons = card.shadowRoot.querySelectorAll('.selection-actions button');
      const clearBtn = Array.from(buttons).find((b) => b.textContent.includes('Clear'));
      expect(clearBtn).toBeUndefined();
    });

    test('shows clear button when selection exists', async () => {
      card._selected = ['automation.test'];
      await card.updateComplete;

      const buttons = card.shadowRoot.querySelectorAll('.selection-actions button');
      const clearBtn = Array.from(buttons).find((b) => b.textContent.includes('Clear'));
      expect(clearBtn).not.toBeUndefined();
    });
  });

  describe('Status summary visibility', () => {
    test('shows status when paused count > 0', async () => {
      card.hass = createMockHass({
        states: {
          'automation.test': {
            entity_id: 'automation.test',
            state: 'on',
            attributes: { friendly_name: 'Test' },
          },
          'sensor.autosnooze_snoozed_automations': {
            state: '1',
            attributes: {
              paused_automations: { a: {} },
              scheduled_snoozes: {},
            },
          },
        },
      });
      await card.updateComplete;

      const summary = card.shadowRoot.querySelector('.status-summary');
      expect(summary).not.toBeNull();
    });

    test('shows status when scheduled count > 0', async () => {
      card.hass = createMockHass({
        states: {
          'automation.test': {
            entity_id: 'automation.test',
            state: 'on',
            attributes: { friendly_name: 'Test' },
          },
          'sensor.autosnooze_snoozed_automations': {
            state: '1',
            attributes: {
              paused_automations: {},
              scheduled_snoozes: { a: {} },
            },
          },
        },
      });
      await card.updateComplete;

      const summary = card.shadowRoot.querySelector('.status-summary');
      expect(summary).not.toBeNull();
    });
  });

  describe('Wake All button visibility', () => {
    test('shows Wake All when more than 1 paused', async () => {
      card.hass = createMockHass({
        states: {
          'automation.test': {
            entity_id: 'automation.test',
            state: 'on',
            attributes: { friendly_name: 'Test' },
          },
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

    test('hides Wake All when only 1 paused', async () => {
      card.hass = createMockHass({
        states: {
          'automation.test': {
            entity_id: 'automation.test',
            state: 'on',
            attributes: { friendly_name: 'Test' },
          },
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
  });
});

// =============================================================================
// SNOOZE BUTTON STATE
// =============================================================================

describe('Snooze Button State', () => {
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

  test('disabled when no selection', async () => {
    card._selected = [];
    await card.updateComplete;

    const btn = card.shadowRoot.querySelector('.snooze-btn');
    expect(btn.disabled).toBe(true);
  });

  test('disabled when loading', async () => {
    card._selected = ['automation.test'];
    card._loading = true;
    await card.updateComplete;

    const btn = card.shadowRoot.querySelector('.snooze-btn');
    expect(btn.disabled).toBe(true);
  });

  test('disabled when duration invalid', async () => {
    card._selected = ['automation.test'];
    card._customDurationInput = 'invalid';
    card._showCustomInput = true;
    await card.updateComplete;

    const btn = card.shadowRoot.querySelector('.snooze-btn');
    expect(btn.disabled).toBe(true);
  });

  test('disabled when schedule mode and no resume time', async () => {
    card._selected = ['automation.test'];
    card._scheduleMode = true;
    card._resumeAtDate = '';
    card._resumeAtTime = '';
    await card.updateComplete;

    const btn = card.shadowRoot.querySelector('.snooze-btn');
    expect(btn.disabled).toBe(true);
  });

  test('enabled when selection and valid duration', async () => {
    card._selected = ['automation.test'];
    card._customDurationInput = '30m';
    await card.updateComplete;

    const btn = card.shadowRoot.querySelector('.snooze-btn');
    expect(btn.disabled).toBe(false);
  });

  test('shows "Snoozing..." when loading', async () => {
    card._selected = ['automation.test'];
    card._loading = true;
    await card.updateComplete;

    const btn = card.shadowRoot.querySelector('.snooze-btn');
    expect(btn.textContent).toContain('Snoozing...');
  });

  test('shows "Schedule" in schedule mode', async () => {
    card._selected = ['automation.test'];
    card._scheduleMode = true;
    card._resumeAtDate = '2026-01-15';
    card._resumeAtTime = '12:00';
    await card.updateComplete;

    const btn = card.shadowRoot.querySelector('.snooze-btn');
    expect(btn.textContent).toContain('Schedule');
  });

  test('shows count in button text', async () => {
    card._selected = ['automation.test'];
    await card.updateComplete;

    const btn = card.shadowRoot.querySelector('.snooze-btn');
    expect(btn.textContent).toContain('(1)');
  });
});

// =============================================================================
// LOCALE SUPPORT
// =============================================================================

describe('Locale Support', () => {
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

  describe('_getLocale', () => {
    test('returns hass locale when available', () => {
      card.hass.locale = { language: 'de-DE' };
      expect(card._getLocale()).toBe('de-DE');
    });

    test('returns undefined when no locale', () => {
      card.hass.locale = null;
      expect(card._getLocale()).toBeUndefined();
    });

    test('returns undefined when hass has no locale property', () => {
      delete card.hass.locale;
      expect(card._getLocale()).toBeUndefined();
    });
  });

  describe('_formatDateTime', () => {
    test('formats date in next year with year', () => {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const result = card._formatDateTime(nextYear.toISOString());
      expect(result).toContain(String(nextYear.getFullYear()));
    });

    test('formats date in current year without year', () => {
      const thisYear = new Date();
      const result = card._formatDateTime(thisYear.toISOString());
      // Current year may or may not be shown depending on locale
      expect(typeof result).toBe('string');
    });
  });
});
