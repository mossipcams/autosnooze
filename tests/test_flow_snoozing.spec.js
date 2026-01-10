/**
 * Tests for User Flow 1: Snoozing Automations
 *
 * This file tests the snoozing flow including:
 * - Automation list fetching and filtering
 * - Selection management
 * - Duration selection and parsing
 * - Snooze operations (duration mode)
 * - Toast notifications
 * - Search and filtering
 * - Cache behavior
 * - shouldUpdate optimization
 * - Backend schema alignment
 * - Sensor state handling
 */

import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import '../src/index.js';

// Get the directory of this test file
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load fixture files
let backendErrors;
let backendResponses;
let servicesSchema;
let servicesYaml;
let translations;

try {
  backendErrors = JSON.parse(
    readFileSync(join(__dirname, 'fixtures/backend-errors.json'), 'utf-8')
  );
  backendResponses = JSON.parse(
    readFileSync(join(__dirname, 'fixtures/backend-responses.json'), 'utf-8')
  );
  servicesSchema = JSON.parse(
    readFileSync(join(__dirname, 'fixtures/services-schema.json'), 'utf-8')
  );
  servicesYaml = parseYaml(
    readFileSync(
      join(__dirname, '../custom_components/autosnooze/services.yaml'),
      'utf-8'
    )
  );
  translations = JSON.parse(
    readFileSync(
      join(__dirname, '../custom_components/autosnooze/translations/en.json'),
      'utf-8'
    )
  );
} catch (error) {
  throw new Error(`Failed to load test fixtures: ${error.message}`);
}

// =============================================================================
// DATE HELPERS
// =============================================================================

function getFutureDate(daysFromNow = 1) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

function getFutureISODateTime(hoursFromNow = 1) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function createDynamicSensorState(options = {}) {
  const {
    pausedCount = 0,
    scheduledCount = 0,
    pausedAutomations = {},
    scheduledSnoozes = {},
  } = options;

  return {
    entity_id: 'sensor.autosnooze_snoozed_automations',
    state: String(pausedCount + scheduledCount),
    attributes: {
      paused_automations: pausedAutomations,
      scheduled_snoozes: scheduledSnoozes,
    },
  };
}

// =============================================================================
// AUTOMATION LIST
// =============================================================================

describe('Automation List', () => {
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

  test('_getAutomations returns list of automations', () => {
    const automations = card._getAutomations();
    expect(automations.length).toBe(2);
    expect(automations.map((a) => a.id)).toContain('automation.test_automation');
    expect(automations.map((a) => a.id)).toContain('automation.living_room');
  });

  test('_getAutomations sorts by name', () => {
    const automations = card._getAutomations();
    expect(automations[0].name).toBe('Living Room Automation');
    expect(automations[1].name).toBe('Test Automation');
  });

  test('_getFilteredAutomations filters by search', () => {
    card._search = 'living';
    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('automation.living_room');
  });

  test('_getFilteredAutomations returns all when no search', () => {
    card._search = '';
    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(2);
  });

  test('_getFilteredAutomations excludes automations with autosnooze_exclude label', () => {
    card._labelRegistry = {
      label_exclude: { name: 'autosnooze_exclude' },
    };
    card._entityRegistry = {
      'automation.test_automation': {
        entity_id: 'automation.test_automation',
        labels: ['label_exclude'],
      },
      'automation.living_room': {
        entity_id: 'automation.living_room',
        labels: [],
      },
    };
    card._automationsCache = null;
    card._search = '';

    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('automation.living_room');
  });

  test('_getFilteredAutomations uses whitelist mode when autosnooze_include label exists', () => {
    card._labelRegistry = {
      label_include: { name: 'autosnooze_include' },
    };
    card._entityRegistry = {
      'automation.test_automation': {
        entity_id: 'automation.test_automation',
        labels: [],
      },
      'automation.living_room': {
        entity_id: 'automation.living_room',
        labels: ['label_include'],
      },
    };
    card._automationsCache = null;
    card._search = '';

    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('automation.living_room');
  });

  test('_getFilteredAutomations include label takes precedence over exclude label', () => {
    card._labelRegistry = {
      label_include: { name: 'autosnooze_include' },
      label_exclude: { name: 'autosnooze_exclude' },
    };
    card._entityRegistry = {
      'automation.test_automation': {
        entity_id: 'automation.test_automation',
        labels: ['label_exclude'],
      },
      'automation.living_room': {
        entity_id: 'automation.living_room',
        labels: ['label_include'],
      },
    };
    card._automationsCache = null;
    card._search = '';

    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('automation.living_room');
  });

  test('_getFilteredAutomations search works with label filtering', () => {
    card._labelRegistry = {
      label_exclude: { name: 'autosnooze_exclude' },
    };
    card._entityRegistry = {
      'automation.test_automation': {
        entity_id: 'automation.test_automation',
        labels: ['label_exclude'],
      },
      'automation.living_room': {
        entity_id: 'automation.living_room',
        labels: [],
      },
    };
    card._automationsCache = null;
    card._search = 'living';

    const filtered = card._getFilteredAutomations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('automation.living_room');
  });
});

// =============================================================================
// SELECTION
// =============================================================================

describe('Selection', () => {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_toggleSelection adds automation to selected', () => {
    card._toggleSelection('automation.test_automation');
    expect(card._selected).toContain('automation.test_automation');
  });

  test('_toggleSelection removes automation if already selected', () => {
    card._selected = ['automation.test_automation'];
    card._toggleSelection('automation.test_automation');
    expect(card._selected).not.toContain('automation.test_automation');
  });

  test('_selectAllVisible selects all filtered automations', () => {
    card._selectAllVisible();
    expect(card._selected.length).toBe(2);
  });

  test('_selectAllVisible deselects all if all already selected', () => {
    card._selected = ['automation.test_automation', 'automation.living_room'];
    card._selectAllVisible();
    expect(card._selected.length).toBe(0);
  });

  test('_clearSelection clears all selections', () => {
    card._selected = ['automation.test_automation', 'automation.living_room'];
    card._clearSelection();
    expect(card._selected.length).toBe(0);
  });
});

// =============================================================================
// DURATION
// =============================================================================

describe('Duration', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_setDuration updates duration in milliseconds', () => {
    card._setDuration(60);
    expect(card._duration).toBe(3600000);
  });

  test('_setDuration updates custom duration fields', () => {
    card._setDuration(90);
    expect(card._customDuration.hours).toBe(1);
    expect(card._customDuration.minutes).toBe(30);
  });

  test('_parseDurationInput parses "30m"', () => {
    const result = card._parseDurationInput('30m');
    expect(result).toEqual({ days: 0, hours: 0, minutes: 30 });
  });

  test('_parseDurationInput parses "2h30m"', () => {
    const result = card._parseDurationInput('2h30m');
    expect(result).toEqual({ days: 0, hours: 2, minutes: 30 });
  });

  test('_parseDurationInput parses "1d2h30m"', () => {
    const result = card._parseDurationInput('1d2h30m');
    expect(result).toEqual({ days: 1, hours: 2, minutes: 30 });
  });

  test('_parseDurationInput parses plain number as minutes', () => {
    const result = card._parseDurationInput('45');
    expect(result).toEqual({ days: 0, hours: 0, minutes: 45 });
  });

  test('_parseDurationInput returns null for invalid input', () => {
    const result = card._parseDurationInput('invalid');
    expect(result).toBeNull();
  });

  test('_parseDurationInput returns null for empty string', () => {
    const result = card._parseDurationInput('');
    expect(result).toBeNull();
  });

  test('_isDurationValid returns true for valid duration', () => {
    card._customDurationInput = '30m';
    expect(card._isDurationValid()).toBe(true);
  });

  test('_isDurationValid returns false for invalid duration', () => {
    card._customDurationInput = 'invalid';
    expect(card._isDurationValid()).toBe(false);
  });

  // Boundary tests for mutation killing
  describe('Duration Parsing Boundary Cases', () => {
    // Zero values should return null
    test.each([
      ['0m', null],
      ['0h', null],
      ['0d', null],
      ['0', null],
    ])('_parseDurationInput(%s) returns null for zero values', (input, expected) => {
      expect(card._parseDurationInput(input)).toBe(expected);
    });

    // Decimals with exact precision verification
    test('_parseDurationInput handles decimals with exact precision', () => {
      // 1.5h = 90 minutes = 0d 1h 30m
      const result1 = card._parseDurationInput('1.5h');
      expect(result1).toEqual({ days: 0, hours: 1, minutes: 30 });

      // 2.5d = 60 hours = 2d 12h 0m
      const result2 = card._parseDurationInput('2.5d');
      expect(result2).toEqual({ days: 2, hours: 12, minutes: 0 });

      // 0.5m rounds to 1m (Math.round(0.5) = 1)
      const result3 = card._parseDurationInput('0.5m');
      expect(result3).toEqual({ days: 0, hours: 0, minutes: 1 });

      // 0.4m rounds to 0, which returns null (totalMinutes <= 0)
      expect(card._parseDurationInput('0.4m')).toBeNull();

      // Combined decimal parsing
      const result4 = card._parseDurationInput('1.5d 1.5h');
      // 1.5d = 2160m, 1.5h = 90m, total = 2250m = 1d 13h 30m
      expect(result4).toEqual({ days: 1, hours: 13, minutes: 30 });
    });

    // Invalid format tests
    test.each([
      ['abc', null],
      ['m', null],
      ['h', null],
      ['d', null],
      ['   ', null],
      ['---', null],
    ])('_parseDurationInput rejects invalid format: "%s"', (input, expected) => {
      expect(card._parseDurationInput(input)).toBe(expected);
    });

    // Whitespace handling
    test('_parseDurationInput handles whitespace in input', () => {
      expect(card._parseDurationInput('1 h 30 m')).toEqual({ days: 0, hours: 1, minutes: 30 });
      expect(card._parseDurationInput('  2h  ')).toEqual({ days: 0, hours: 2, minutes: 0 });
    });

    // Case insensitivity
    test('_parseDurationInput handles case insensitivity', () => {
      expect(card._parseDurationInput('1H')).toEqual({ days: 0, hours: 1, minutes: 0 });
      expect(card._parseDurationInput('1D')).toEqual({ days: 1, hours: 0, minutes: 0 });
      expect(card._parseDurationInput('30M')).toEqual({ days: 0, hours: 0, minutes: 30 });
      expect(card._parseDurationInput('1D2H30M')).toEqual({ days: 1, hours: 2, minutes: 30 });
    });

    // Normalization tests - verify Math.floor operations
    test('_parseDurationInput normalization produces correct days/hours/minutes', () => {
      // 90m should normalize to 0d 1h 30m
      const result = card._parseDurationInput('90m');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 30 });
      // Verify exact arithmetic: 90 % 60 = 30 minutes, 90 / 60 = 1 hour
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(30);

      // 25h should normalize to 1d 1h 0m
      const result2 = card._parseDurationInput('25h');
      expect(result2).toEqual({ days: 1, hours: 1, minutes: 0 });

      // 1500m = 25h = 1d 1h
      const result3 = card._parseDurationInput('1500m');
      expect(result3).toEqual({ days: 1, hours: 1, minutes: 0 });

      // Large values: 3000m = 50h = 2d 2h
      const result4 = card._parseDurationInput('3000m');
      expect(result4).toEqual({ days: 2, hours: 2, minutes: 0 });
    });

    // MINUTES_PER constant validation through parsing
    test('_parseDurationInput uses correct MINUTES_PER constants', () => {
      // 1 day = 1440 minutes
      const oneDay = card._parseDurationInput('1440m');
      expect(oneDay).toEqual({ days: 1, hours: 0, minutes: 0 });

      // 1 hour = 60 minutes
      const oneHour = card._parseDurationInput('60m');
      expect(oneHour).toEqual({ days: 0, hours: 1, minutes: 0 });

      // 1439m = 23h 59m (just under 1 day)
      const almostDay = card._parseDurationInput('1439m');
      expect(almostDay).toEqual({ days: 0, hours: 23, minutes: 59 });

      // 1441m = 1d 0h 1m (just over 1 day)
      const justOverDay = card._parseDurationInput('1441m');
      expect(justOverDay).toEqual({ days: 1, hours: 0, minutes: 1 });
    });

    // Combined units
    test('_parseDurationInput handles combined units correctly', () => {
      expect(card._parseDurationInput('1d 2h 30m')).toEqual({ days: 1, hours: 2, minutes: 30 });
      expect(card._parseDurationInput('1d2h30m')).toEqual({ days: 1, hours: 2, minutes: 30 });
      expect(card._parseDurationInput('1D 2H 30M')).toEqual({ days: 1, hours: 2, minutes: 30 });
    });

    // Plain number interpretation as minutes
    test('_parseDurationInput interprets plain numbers as minutes', () => {
      expect(card._parseDurationInput('45')).toEqual({ days: 0, hours: 0, minutes: 45 });
      expect(card._parseDurationInput('120')).toEqual({ days: 0, hours: 2, minutes: 0 });
      expect(card._parseDurationInput('1')).toEqual({ days: 0, hours: 0, minutes: 1 });
    });
  });
});

// =============================================================================
// FORMATTING
// =============================================================================

describe('Formatting', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
      states: {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_formatDuration formats single unit', () => {
    expect(card._formatDuration(0, 2, 0)).toBe('2 hours');
    expect(card._formatDuration(1, 0, 0)).toBe('1 day');
    expect(card._formatDuration(0, 0, 30)).toBe('30 minutes');
  });

  test('_formatDuration formats multiple units', () => {
    expect(card._formatDuration(1, 2, 30)).toBe('1 day, 2 hours, 30 minutes');
  });

  test('_formatDuration handles singular/plural', () => {
    expect(card._formatDuration(1, 1, 1)).toBe('1 day, 1 hour, 1 minute');
    expect(card._formatDuration(2, 2, 2)).toBe('2 days, 2 hours, 2 minutes');
  });

  test('_formatCountdown returns "Resuming..." for past time', () => {
    const pastTime = new Date(Date.now() - 10000).toISOString();
    expect(card._formatCountdown(pastTime)).toBe('Resuming...');
  });

  test('_formatCountdown formats future time correctly', () => {
    const futureTime = new Date(Date.now() + 65000).toISOString();
    const result = card._formatCountdown(futureTime);
    expect(result).toMatch(/\d+m \d+s/);
  });

  test('_formatCountdown handles hours correctly', () => {
    const futureTime = new Date(Date.now() + 3700000).toISOString();
    const result = card._formatCountdown(futureTime);
    expect(result).toMatch(/\d+h/);
  });

  test('_formatCountdown handles days correctly', () => {
    const futureTime = new Date(Date.now() + 90000000).toISOString();
    const result = card._formatCountdown(futureTime);
    expect(result).toMatch(/\d+d/);
  });

  test('_formatDateTime formats ISO string', () => {
    const result = card._formatDateTime('2024-12-25T14:30:00Z');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  // Mutation-killing tests for exact formatting
  describe('Time Formatting Exact Validation', () => {
    test('_formatCountdown exact string for past time', () => {
      const pastTime = new Date(Date.now() - 10000).toISOString();
      const result = card._formatCountdown(pastTime);
      // Verify exact string including ellipsis
      expect(result).toBe('Resuming...');
      expect(result).not.toBe('Resuming');
      expect(result).not.toBe('Resuming..');
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBe(11);
    });

    test('_formatDuration uses exact comma-space separator', () => {
      const result = card._formatDuration(1, 2, 30);
      expect(result).toBe('1 day, 2 hours, 30 minutes');
      expect(result).toContain(', ');
      expect(result).not.toContain(',  ');  // not double space
      expect(result).not.toContain(' ,');   // not space before comma
    });

    test('_formatDuration exact pluralization boundary at 1', () => {
      // Singular (exactly 1)
      expect(card._formatDuration(1, 0, 0)).toBe('1 day');
      expect(card._formatDuration(0, 1, 0)).toBe('1 hour');
      expect(card._formatDuration(0, 0, 1)).toBe('1 minute');

      // Plural (2 or more)
      expect(card._formatDuration(2, 0, 0)).toBe('2 days');
      expect(card._formatDuration(0, 2, 0)).toBe('2 hours');
      expect(card._formatDuration(0, 0, 2)).toBe('2 minutes');

      // Zero produces no output for that unit
      expect(card._formatDuration(0, 0, 0)).toBe('');
    });

    test('_formatDuration omits zero units from output', () => {
      // 1 day, 30 minutes (hours omitted)
      expect(card._formatDuration(1, 0, 30)).toBe('1 day, 30 minutes');
      expect(card._formatDuration(1, 0, 30)).not.toContain('hour');

      // 2 hours (days and minutes omitted)
      expect(card._formatDuration(0, 2, 0)).toBe('2 hours');
      expect(card._formatDuration(0, 2, 0)).not.toContain('day');
      expect(card._formatDuration(0, 2, 0)).not.toContain('minute');
    });

    test('_formatCountdown exact format with days', () => {
      // 1 day, 2 hours, 30 minutes from now
      const futureTime = new Date(Date.now() + (26 * 60 + 30) * 60 * 1000).toISOString();
      const result = card._formatCountdown(futureTime);
      // Format should be "1d Xh Xm"
      expect(result).toMatch(/^1d \d+h \d+m$/);
      expect(result).toContain('d ');
      expect(result).toContain('h ');
      expect(result).toContain('m');
    });

    test('_formatCountdown exact format without days', () => {
      // 1 hour, 5 minutes from now
      const futureTime = new Date(Date.now() + (65 * 60 * 1000)).toISOString();
      const result = card._formatCountdown(futureTime);
      // Format should be "1h Xm Xs" (no days)
      expect(result).toMatch(/^\d+h \d+m \d+s$/);
      expect(result).not.toContain('d');
    });

    test('_formatCountdown exact format minutes only', () => {
      // 2 minutes, 30 seconds from now
      const futureTime = new Date(Date.now() + (2 * 60 * 1000 + 30 * 1000)).toISOString();
      const result = card._formatCountdown(futureTime);
      // Format should be "Xm Xs" (no hours or days)
      expect(result).toMatch(/^\d+m \d+s$/);
      expect(result).not.toContain('h');
      expect(result).not.toContain('d');
    });

    test('_formatCountdown boundary at exactly 0 returns Resuming...', () => {
      // Exactly now or in the past
      const exactlyNow = new Date(Date.now()).toISOString();
      expect(card._formatCountdown(exactlyNow)).toBe('Resuming...');

      const slightlyPast = new Date(Date.now() - 1).toISOString();
      expect(card._formatCountdown(slightlyPast)).toBe('Resuming...');
    });

    test('_formatCountdown TIME_MS constant verification', () => {
      // 1 day, 1 hour, 1 minute, 1 second = 90061000ms
      // (24*3600 + 3600 + 60 + 1) * 1000 = 90061000
      const futureTime = new Date(Date.now() + 90061000).toISOString();
      const result = card._formatCountdown(futureTime);
      // Should show 1d format
      expect(result).toMatch(/^1d 1h 1m$/);
    });
  });
});

// =============================================================================
// PAUSED GETTERS
// =============================================================================

describe('Paused Getters', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
      states: {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_getPaused returns empty object when no paused automations', () => {
    expect(card._getPaused()).toEqual({});
  });

  test('_getPaused returns paused automations from sensor', () => {
    card.hass.states['sensor.autosnooze_snoozed_automations'].attributes.paused_automations = {
      'automation.test': { friendly_name: 'Test', resume_at: '2024-01-01T12:00:00Z' },
    };
    const paused = card._getPaused();
    expect(paused['automation.test']).toBeDefined();
    expect(paused['automation.test'].friendly_name).toBe('Test');
  });
});

// =============================================================================
// SNOOZE OPERATIONS - DURATION MODE
// =============================================================================

describe('Snooze Operations - Duration Mode', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('calls pause service with duration parameters', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 1, minutes: 30 };
    card._scheduleMode = false;

    await card._snooze();

    expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'pause', {
      entity_id: ['automation.test'],
      days: 0,
      hours: 1,
      minutes: 30,
    });
  });

  test('clears selection after snooze', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    expect(card._selected).toEqual([]);
  });

  test('does nothing when no selection', async () => {
    card._selected = [];

    await card._snooze();

    expect(mockHass.callService).not.toHaveBeenCalled();
  });

  test('does nothing when duration is zero', async () => {
    card._selected = ['automation.test'];
    card._duration = 0;
    card._customDuration = { days: 0, hours: 0, minutes: 0 };

    await card._snooze();

    expect(mockHass.callService).not.toHaveBeenCalled();
  });

  test('does nothing when loading', async () => {
    card._selected = ['automation.test'];
    card._loading = true;

    await card._snooze();

    expect(mockHass.callService).not.toHaveBeenCalled();
  });

  test('handles service error gracefully', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };
    mockHass.callService.mockRejectedValueOnce(new Error('Service failed'));

    await card._snooze();

    expect(card._loading).toBe(false);
  });
});

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================

describe('Toast Notifications', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_showToast creates toast element', () => {
    card._showToast('Test message');

    const toast = card.shadowRoot.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Test message');
  });

  test('_showToast removes existing toast', () => {
    card._showToast('First message');
    card._showToast('Second message');

    const toasts = card.shadowRoot.querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Second message');
  });

  test('_showToast with undo option creates undo button', () => {
    card._showToast('Test message', {
      showUndo: true,
      onUndo: vi.fn(),
    });

    const toast = card.shadowRoot.querySelector('.toast');
    const undoBtn = toast.querySelector('.toast-undo-btn');
    expect(undoBtn).not.toBeNull();
    expect(undoBtn.textContent).toBe('Undo');
  });

  test('clicking undo button calls onUndo callback', () => {
    const onUndoMock = vi.fn();
    card._showToast('Test message', {
      showUndo: true,
      onUndo: onUndoMock,
    });

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    expect(onUndoMock).toHaveBeenCalled();
  });

  test('clicking undo button removes toast', () => {
    card._showToast('Test message', {
      showUndo: true,
      onUndo: vi.fn(),
    });

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    const toast = card.shadowRoot.querySelector('.toast');
    expect(toast).toBeNull();
  });

  test('toast auto-removes after timeout', () => {
    vi.useFakeTimers();

    card._showToast('Test message');

    expect(card.shadowRoot.querySelector('.toast')).not.toBeNull();

    vi.advanceTimersByTime(5300);

    expect(card.shadowRoot.querySelector('.toast')).toBeNull();

    vi.useRealTimers();
  });
});

// =============================================================================
// SEARCH INPUT HANDLING
// =============================================================================

describe('Search Input Handling', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_handleSearchInput debounces search updates', async () => {
    vi.useFakeTimers();

    const event = { target: { value: 'test' } };
    card._handleSearchInput(event);

    expect(card._search).toBe('');
    vi.advanceTimersByTime(350);
    expect(card._search).toBe('test');

    vi.useRealTimers();
  });
});

// =============================================================================
// CUSTOM DURATION INPUT
// =============================================================================

describe('Custom Duration Input', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('clicking custom pill toggles custom input visibility', async () => {
    await card.updateComplete;
    const pills = card.shadowRoot.querySelectorAll('.pill');
    const customPill = pills[pills.length - 1];

    customPill.click();
    await card.updateComplete;

    expect(card._showCustomInput).toBe(true);
  });

  test('custom duration input renders when visible', async () => {
    card._showCustomInput = true;
    await card.updateComplete;

    const customInput = card.shadowRoot.querySelector('.custom-duration-input');
    expect(customInput).not.toBeNull();
  });

  test('custom input hidden when _showCustomInput is false', async () => {
    card._showCustomInput = false;
    await card.updateComplete;

    const customInput = card.shadowRoot.querySelector('.custom-duration-input');
    expect(customInput).toBeNull();
  });

  test('_handleDurationInput updates custom duration state', () => {
    card._handleDurationInput('2h30m');
    expect(card._customDurationInput).toBe('2h30m');
    expect(card._customDuration).toEqual({ days: 0, hours: 2, minutes: 30 });
  });

  test('_handleDurationInput handles invalid input gracefully', () => {
    card._handleDurationInput('invalid');
    expect(card._customDurationInput).toBe('invalid');
  });

  test('clicking preset pill hides custom input', async () => {
    card._showCustomInput = true;
    await card.updateComplete;

    const pills = card.shadowRoot.querySelectorAll('.pill');
    const presetPill = pills[0];
    presetPill.click();
    await card.updateComplete;

    expect(card._showCustomInput).toBe(false);
  });
});

// =============================================================================
// UI RENDERING
// =============================================================================

describe('UI Rendering', () => {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('renders header with custom title', async () => {
    card.setConfig({ title: 'My Snooze' });
    await card.updateComplete;
    const header = card.shadowRoot.querySelector('.header');
    expect(header.textContent).toContain('My Snooze');
  });

  test('snooze button is disabled when no selection', async () => {
    card._selected = [];
    await card.updateComplete;
    const btn = card.shadowRoot.querySelector('.snooze-btn');
    expect(btn.disabled).toBe(true);
  });

  test('renders empty message when no automations match filter', async () => {
    card._search = 'nonexistent';
    await card.updateComplete;
    expect(card.shadowRoot.querySelector('.list-empty')).not.toBeNull();
  });
});

// =============================================================================
// LIST ITEM INTERACTIONS
// =============================================================================

describe('List Item Interactions', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('clicking list item selects automation', async () => {
    const listItem = card.shadowRoot.querySelector('.list-item');
    listItem.click();
    await card.updateComplete;

    expect(card._selected.length).toBe(1);
  });

  test('checkbox change toggles selection', async () => {
    const checkbox = card.shadowRoot.querySelector('.list-item input[type="checkbox"]');
    checkbox.click();
    await card.updateComplete;

    expect(card._selected.length).toBe(1);
  });

  test('checkbox click stops propagation', async () => {
    const checkbox = card.shadowRoot.querySelector('.list-item input[type="checkbox"]');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const stopPropSpy = vi.spyOn(clickEvent, 'stopPropagation');

    checkbox.dispatchEvent(clickEvent);

    expect(stopPropSpy).toHaveBeenCalled();
  });
});

// =============================================================================
// SHOULD UPDATE OPTIMIZATION
// =============================================================================

describe('shouldUpdate optimization', () => {
  let card;
  let localCreateMockHass;

  beforeEach(async () => {
    localCreateMockHass = (overrides = {}) => ({
      states: {
        'automation.test1': { state: 'on', attributes: { friendly_name: 'Test 1' } },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
        ...overrides.states,
      },
      entities: overrides.entities || {},
      areas: overrides.areas || {},
      callService: vi.fn().mockResolvedValue({}),
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = localCreateMockHass();
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('shouldUpdate returns true for non-hass property changes', () => {
    const changedProps = new Map();
    changedProps.set('_selected', []);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when oldHass is undefined', () => {
    const changedProps = new Map();
    changedProps.set('hass', undefined);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when newHass is null', () => {
    card.hass = null;
    const changedProps = new Map();
    changedProps.set('hass', localCreateMockHass());
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when autosnooze sensor changes', () => {
    const oldHass = localCreateMockHass();
    const newHass = localCreateMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '1',
          attributes: { paused_automations: { 'automation.test1': {} }, scheduled_snoozes: {} },
        },
      },
    });
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when entities registry changes', () => {
    const oldHass = localCreateMockHass({ entities: { a: 1 } });
    const newHass = localCreateMockHass({ entities: { b: 2 } });
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when areas change', () => {
    const oldHass = localCreateMockHass({ areas: { area1: { name: 'Old' } } });
    const newHass = localCreateMockHass({ areas: { area1: { name: 'New' } } });
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when an automation state changes', () => {
    const oldHass = localCreateMockHass();
    const newHass = localCreateMockHass({
      states: {
        'automation.test1': { state: 'off', attributes: { friendly_name: 'Test 1' } },
      },
    });
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns false when no relevant changes', () => {
    const hass = localCreateMockHass();
    card.hass = hass;
    const changedProps = new Map();
    changedProps.set('hass', hass);
    expect(card.shouldUpdate(changedProps)).toBe(false);
  });
});

// =============================================================================
// CACHE BEHAVIOR
// =============================================================================

describe('Cache Behavior', () => {
  let card;

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
    card = null;
    vi.clearAllMocks();
  });

  test('_getAutomations returns cached result when hass.states reference unchanged', async () => {
    const mockHass = createMockHass({
      states: {
        'automation.test1': {
          entity_id: 'automation.test1',
          state: 'on',
          attributes: { friendly_name: 'Test 1' },
        },
        'automation.test2': {
          entity_id: 'automation.test2',
          state: 'on',
          attributes: { friendly_name: 'Test 2' },
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
    document.body.appendChild(card);
    await card.updateComplete;

    const result1 = card._getAutomations();
    expect(result1.length).toBe(2);

    const cacheRef = card._automationsCache;
    expect(cacheRef).not.toBeNull();

    const result2 = card._getAutomations();
    expect(result2).toBe(cacheRef);
  });

  test('_getAutomations invalidates cache when hass.states reference changes', async () => {
    const initialStates = {
      'automation.test1': {
        entity_id: 'automation.test1',
        state: 'on',
        attributes: { friendly_name: 'Test 1' },
      },
      'sensor.autosnooze_snoozed_automations': {
        state: '0',
        attributes: { paused_automations: {}, scheduled_snoozes: {} },
      },
    };

    const mockHass = createMockHass({ states: initialStates });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const result1 = card._getAutomations();
    expect(result1.length).toBe(1);
    const cacheRef1 = card._automationsCache;

    const newStates = {
      ...initialStates,
      'automation.test2': {
        entity_id: 'automation.test2',
        state: 'on',
        attributes: { friendly_name: 'Test 2' },
      },
    };

    card.hass = createMockHass({ states: newStates });
    await card.updateComplete;

    const result2 = card._getAutomations();
    expect(result2.length).toBe(2);
    expect(result2).not.toBe(cacheRef1);
  });
});

// =============================================================================
// DEBOUNCE BEHAVIOR
// =============================================================================

describe('Debounce Behavior', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
      states: {
        'automation.test1': {
          entity_id: 'automation.test1',
          state: 'on',
          attributes: { friendly_name: 'Test One' },
        },
        'automation.test2': {
          entity_id: 'automation.test2',
          state: 'on',
          attributes: { friendly_name: 'Test Two' },
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
    card = null;
    vi.clearAllMocks();
  });

  test('search input creates a timeout (debounce mechanism)', () => {
    expect(card._searchTimeout).toBeNull();

    card._handleSearchInput({ target: { value: 'test' } });

    expect(card._searchTimeout).not.toBeNull();
    expect(card._searchTimeout).toBeTruthy();
    expect(card._search).toBe('');
  });

  test('rapid inputs reset the debounce timer', () => {
    card._handleSearchInput({ target: { value: 'first' } });
    const firstTimeout = card._searchTimeout;
    expect(firstTimeout).not.toBeNull();

    card._handleSearchInput({ target: { value: 'second' } });
    const secondTimeout = card._searchTimeout;

    expect(secondTimeout).not.toBeNull();
    expect(secondTimeout).not.toBe(firstTimeout);
    expect(card._search).toBe('');
  });

  test('search value is updated after debounce period', async () => {
    const SEARCH_DEBOUNCE_MS = 300;

    card._handleSearchInput({ target: { value: 'test query' } });
    expect(card._search).toBe('');

    await new Promise(resolve => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 50));

    expect(card._search).toBe('test query');
    expect(card._searchTimeout).toBeNull();
  });

  test('only final value is applied after rapid typing', async () => {
    const SEARCH_DEBOUNCE_MS = 300;

    card._handleSearchInput({ target: { value: 'a' } });
    card._handleSearchInput({ target: { value: 'ab' } });
    card._handleSearchInput({ target: { value: 'abc' } });
    card._handleSearchInput({ target: { value: 'abcd' } });

    expect(card._search).toBe('');

    await new Promise(resolve => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 50));

    expect(card._search).toBe('abcd');
  });
});

// =============================================================================
// BACKEND ERROR SCHEMA ALIGNMENT
// =============================================================================

describe('Backend Error Schema Alignment', () => {
  describe('Translation keys synchronization', () => {
    test('all backend translation keys exist in frontend ERROR_MESSAGES', () => {
      const backendKeys = Object.keys(backendErrors.errors);
      expect(backendKeys.length).toBeGreaterThan(0);

      const CardClass = customElements.get('autosnooze-card');
      expect(CardClass).toBeDefined();
      const card = new CardClass();

      for (const key of backendKeys) {
        const error = { translation_key: key };
        const result = card._getErrorMessage(error, 'Default message');

        expect(result).not.toContain('Check Home Assistant logs');
        expect(result).not.toBe('Default message. Check Home Assistant logs for details.');
      }
    });

    test('frontend ERROR_MESSAGES contains all required translation keys', () => {
      const requiredKeys = servicesSchema.translation_keys;
      expect(requiredKeys.length).toBeGreaterThan(0);

      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();

      for (const key of requiredKeys) {
        const error = { translation_key: key };
        const result = card._getErrorMessage(error, 'Fallback');
        expect(result).not.toBe('Fallback. Check Home Assistant logs for details.');
      }
    });
  });

  describe('Error response format handling', () => {
    let card;
    let mockCallService;

    beforeEach(async () => {
      mockCallService = vi.fn().mockResolvedValue(undefined);

      const mockHass = createMockHass({
        states: {
          'automation.test': {
            entity_id: 'automation.test',
            state: 'on',
            attributes: { friendly_name: 'Test Automation' },
          },
          'sensor.autosnooze_snoozed_automations': {
            state: '0',
            attributes: { paused_automations: {}, scheduled_snoozes: {} },
          },
        },
        callService: mockCallService,
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
      card = null;
      mockCallService = null;
      vi.clearAllMocks();
    });

    test('handles error with translation_key at root level', () => {
      const error = backendResponses.error_responses.not_automation.response;
      const result = card._getErrorMessage(error, 'Default');
      expect(result).toBe('Failed to snooze: One or more selected items are not automations');
    });

    test('handles error with translation_key in data property', () => {
      const variant = backendResponses.error_responses.not_automation.response_variants[0];
      const result = card._getErrorMessage(variant, 'Default');
      expect(result).toBe('Failed to snooze: One or more selected items are not automations');
    });

    test('handles resume_time_past error variants', () => {
      const mainResponse = backendResponses.error_responses.resume_time_past.response;
      expect(card._getErrorMessage(mainResponse, 'Default')).toBe(
        'Failed to snooze: Resume time must be in the future'
      );
    });

    test('handles disable_after_resume error variants', () => {
      const mainResponse = backendResponses.error_responses.disable_after_resume.response;
      expect(card._getErrorMessage(mainResponse, 'Default')).toBe(
        'Failed to snooze: Snooze time must be before resume time'
      );
    });

    test('handles invalid_duration error variants', () => {
      const mainResponse = backendResponses.error_responses.invalid_duration.response;
      expect(card._getErrorMessage(mainResponse, 'Default')).toBe(
        'Failed to snooze: Please specify a valid duration (days, hours, or minutes)'
      );
    });

    test('returns default with log message for unknown errors', () => {
      const unknownError = { message: 'Completely unknown error' };
      const result = card._getErrorMessage(unknownError, 'Something went wrong');
      expect(result).toBe('Something went wrong. Check Home Assistant logs for details.');
    });

    test('handles null/undefined error gracefully', () => {
      expect(card._getErrorMessage(null, 'Fallback')).toBe(
        'Fallback. Check Home Assistant logs for details.'
      );
      expect(card._getErrorMessage(undefined, 'Fallback')).toBe(
        'Fallback. Check Home Assistant logs for details.'
      );
    });
  });
});

// =============================================================================
// SERVICES.YAML VALIDATION
// =============================================================================

describe('Services.yaml Schema Validation', () => {
  describe('Service definitions match schema', () => {
    test('all expected services are defined in services.yaml', () => {
      const expectedServices = Object.keys(servicesSchema.services);
      const actualServices = Object.keys(servicesYaml);

      for (const service of expectedServices) {
        expect(actualServices, `Missing service: ${service}`).toContain(service);
      }
    });

    test('pause service has correct fields', () => {
      const pauseService = servicesYaml.pause;
      expect(pauseService).toBeDefined();
      expect(pauseService.fields).toBeDefined();

      expect(pauseService.fields.entity_id).toBeDefined();
      expect(pauseService.fields.entity_id.required).toBe(true);

      expect(pauseService.fields.days).toBeDefined();
      expect(pauseService.fields.hours).toBeDefined();
      expect(pauseService.fields.minutes).toBeDefined();

      expect(pauseService.fields.disable_at).toBeDefined();
      expect(pauseService.fields.resume_at).toBeDefined();
    });

    test('cancel service has correct fields', () => {
      const cancelService = servicesYaml.cancel;
      expect(cancelService).toBeDefined();
      expect(cancelService.fields).toBeDefined();
      expect(cancelService.fields.entity_id).toBeDefined();
      expect(cancelService.fields.entity_id.required).toBe(true);
    });

    test('cancel_all service has no required fields', () => {
      const cancelAllService = servicesYaml.cancel_all;
      expect(cancelAllService).toBeDefined();
      expect(cancelAllService.fields).toBeUndefined();
    });
  });

  describe('Duration field constraints', () => {
    test('days field has correct min/max', () => {
      const days = servicesYaml.pause.fields.days;
      expect(days.selector.number.min).toBe(0);
      expect(days.selector.number.max).toBe(365);
    });

    test('hours field has correct min/max', () => {
      const hours = servicesYaml.pause.fields.hours;
      expect(hours.selector.number.min).toBe(0);
      expect(hours.selector.number.max).toBe(23);
    });

    test('minutes field has correct min/max', () => {
      const minutes = servicesYaml.pause.fields.minutes;
      expect(minutes.selector.number.min).toBe(0);
      expect(minutes.selector.number.max).toBe(59);
    });
  });

  describe('Entity selectors', () => {
    test('pause entity_id selector restricts to automation domain', () => {
      const entityId = servicesYaml.pause.fields.entity_id;
      expect(entityId.selector.entity.domain).toBe('automation');
      expect(entityId.selector.entity.multiple).toBe(true);
    });

    test('cancel entity_id selector restricts to automation domain', () => {
      const entityId = servicesYaml.cancel.fields.entity_id;
      expect(entityId.selector.entity.domain).toBe('automation');
    });
  });
});

// =============================================================================
// SENSOR STATE HANDLING
// =============================================================================

describe('Sensor State Handling', () => {
  let card;

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
    card = null;
    vi.clearAllMocks();
  });

  test('handles idle sensor state correctly', async () => {
    const sensorState = createDynamicSensorState();

    const mockHass = createMockHass({
      states: {
        [sensorState.entity_id]: sensorState,
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const paused = card._getPaused();
    const scheduled = card._getScheduled();

    expect(Object.keys(paused).length).toBe(0);
    expect(Object.keys(scheduled).length).toBe(0);
  });

  test('handles sensor state with paused automations', async () => {
    const pausedAutomations = {
      'automation.living_room_lights': {
        entity_id: 'automation.living_room_lights',
        friendly_name: 'Living Room Lights',
        resume_at: getFutureISODateTime(2),
        paused_at: new Date().toISOString(),
        days: 0,
        hours: 2,
        minutes: 0,
        disable_at: null,
      },
      'automation.bedroom_fan': {
        entity_id: 'automation.bedroom_fan',
        friendly_name: 'Bedroom Fan',
        resume_at: getFutureISODateTime(12),
        paused_at: new Date().toISOString(),
        days: 0,
        hours: 12,
        minutes: 0,
        disable_at: null,
      },
    };

    const sensorState = createDynamicSensorState({
      pausedCount: 2,
      pausedAutomations,
    });

    const mockHass = createMockHass({
      states: {
        [sensorState.entity_id]: sensorState,
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const paused = card._getPaused();
    expect(Object.keys(paused).length).toBe(2);
    expect(paused['automation.living_room_lights']).toBeDefined();
    expect(paused['automation.bedroom_fan']).toBeDefined();
  });

  test('handles missing sensor gracefully', async () => {
    const mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test' },
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const paused = card._getPaused();
    const scheduled = card._getScheduled();

    expect(paused).toEqual({});
    expect(scheduled).toEqual({});
  });

  test('handles sensor with null attributes gracefully', async () => {
    const mockHass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: null,
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const paused = card._getPaused();
    const scheduled = card._getScheduled();

    expect(paused).toEqual({});
    expect(scheduled).toEqual({});
  });
});

// =============================================================================
// INTEGRATION STATE CHANGES
// =============================================================================

describe('Integration State Changes', () => {
  let card;
  let mockCallService;

  beforeEach(async () => {
    mockCallService = vi.fn().mockResolvedValue(undefined);

    const mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      callService: mockCallService,
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
    card = null;
    vi.clearAllMocks();
  });

  test('snooze clears selection after successful call', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 1, minutes: 0 };

    expect(card._selected.length).toBe(1);

    await card._snooze();

    expect(card._selected.length).toBe(0);
  });

  test('snooze clears schedule inputs after successful scheduled call', async () => {
    const futureDate = getFutureDate(7);

    card._selected = ['automation.test'];
    card._scheduleMode = true;
    card._disableAtDate = getFutureDate(1);
    card._disableAtTime = '10:00';
    card._resumeAtDate = futureDate;
    card._resumeAtTime = '14:00';

    await card._snooze();

    expect(card._disableAtDate).toBe('');
    expect(card._disableAtTime).toBe('');
    expect(card._resumeAtDate).toBe('');
    expect(card._resumeAtTime).toBe('');
  });

  test('loading state is properly managed during snooze', async () => {
    let loadingDuringCall = false;

    mockCallService.mockImplementation(async () => {
      loadingDuringCall = card._loading;
      return undefined;
    });

    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 1, minutes: 0 };

    expect(card._loading).toBe(false);

    await card._snooze();

    expect(card._loading).toBe(false);
  });
});

// =============================================================================
// TRANSLATION CONSISTENCY
// =============================================================================

describe('Translation Consistency', () => {
  test('exception messages in translations match backend error meanings', () => {
    const exceptions = translations.exceptions;
    expect(exceptions).toBeDefined();

    expect(exceptions.not_automation.message).toContain('automation');
    expect(exceptions.not_automation.message).toContain('{entity_id}');

    expect(exceptions.resume_time_past.message.toLowerCase()).toContain('future');

    expect(exceptions.disable_after_resume.message.toLowerCase()).toContain('before');

    expect(exceptions.invalid_duration.message.toLowerCase()).toContain('duration');
  });

  test('services in translations match services.yaml', () => {
    const translationServices = translations.services;
    const yamlServices = Object.keys(servicesYaml);

    expect(yamlServices.length).toBeGreaterThan(0);

    for (const service of yamlServices) {
      expect(translationServices[service], `Translation missing for service: ${service}`).toBeDefined();
      expect(translationServices[service].name, `Translation name missing for service: ${service}`).toBeDefined();
    }
  });
});
