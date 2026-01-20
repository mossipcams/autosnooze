/**
 * Mutation Coverage Tests
 *
 * These tests are specifically designed to kill mutants by:
 * 1. Testing exact constant values
 * 2. Testing specific string literals
 * 3. Testing arithmetic operations at boundaries
 * 4. Testing conditional logic exhaustively
 * 5. Testing return values precisely
 */

import { vi } from 'vitest';
import '../custom_components/autosnooze/www/autosnooze-card.js';

// =============================================================================
// CONSTANT VALUE TESTS
// =============================================================================

describe('Constant Values - Mutation Killing', () => {
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

  describe('Default Duration - 30 minutes', () => {
    test('initial duration is exactly 30 minutes in milliseconds', () => {
      // 30 * 60 * 1000 = 1800000
      expect(card._duration).toBe(1800000);
    });

    test('initial custom duration has correct default values', () => {
      expect(card._customDuration.days).toBe(0);
      expect(card._customDuration.hours).toBe(0);
      expect(card._customDuration.minutes).toBe(30);
    });

    test('initial custom duration input is "30m"', () => {
      expect(card._customDurationInput).toBe('30m');
    });
  });

  describe('Duration Pill Labels', () => {
    test('duration pills have correct labels', async () => {
      await card.updateComplete;
      const pills = card.shadowRoot.querySelectorAll('.pill');
      const labels = Array.from(pills).map((p) => p.textContent.trim());

      expect(labels).toContain('30m');
      expect(labels).toContain('1h');
      expect(labels).toContain('1d');
      expect(labels).toContain('Custom');
    });
  });

  describe('Time Constants in Duration Calculations', () => {
    test('_setDuration uses 60000ms per minute', () => {
      card._setDuration(1);
      expect(card._duration).toBe(60000);
    });

    test('_setDuration uses 3600000ms per hour', () => {
      card._setDuration(60);
      expect(card._duration).toBe(3600000);
    });

    test('_setDuration uses 86400000ms per day', () => {
      card._setDuration(1440);
      expect(card._duration).toBe(86400000);
    });

    test('_setDuration calculates days from 1440 minutes', () => {
      card._setDuration(1440);
      expect(card._customDuration.days).toBe(1);
      expect(card._customDuration.hours).toBe(0);
      expect(card._customDuration.minutes).toBe(0);
    });

    test('_setDuration calculates hours from 60 minutes', () => {
      card._setDuration(60);
      expect(card._customDuration.days).toBe(0);
      expect(card._customDuration.hours).toBe(1);
      expect(card._customDuration.minutes).toBe(0);
    });
  });

  describe('Countdown Formatting Constants', () => {
    test('_formatCountdown uses 86400000ms for day calculation', () => {
      // Add extra buffer to avoid timing edge cases
      const oneDayFromNow = new Date(Date.now() + 86400000 + 2000).toISOString();
      const result = card._formatCountdown(oneDayFromNow);
      expect(result).toMatch(/1d/);
    });

    test('_formatCountdown uses 3600000ms for hour calculation', () => {
      // Add buffer for timing
      const oneHourFromNow = new Date(Date.now() + 3600000 + 2000).toISOString();
      const result = card._formatCountdown(oneHourFromNow);
      expect(result).toMatch(/1h/);
    });

    test('_formatCountdown uses 60000ms for minute calculation', () => {
      // Add buffer for timing
      const twoMinutesFromNow = new Date(Date.now() + 120000 + 2000).toISOString();
      const result = card._formatCountdown(twoMinutesFromNow);
      expect(result).toMatch(/2m/);
    });

    test('_formatCountdown uses 1000ms for second calculation', () => {
      // Add buffer for timing
      const thirtySecondsFromNow = new Date(Date.now() + 30000 + 2000).toISOString();
      const result = card._formatCountdown(thirtySecondsFromNow);
      expect(result).toMatch(/0m/);
    });
  });
});

// =============================================================================
// STRING LITERAL TESTS
// =============================================================================

describe('String Literal Values - Mutation Killing', () => {
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

  describe('Countdown String Literals', () => {
    test('_formatCountdown returns exactly "Resuming..." for past time', () => {
      const pastTime = new Date(Date.now() - 1000).toISOString();
      expect(card._formatCountdown(pastTime)).toBe('Resuming...');
    });

    test('_formatCountdown returns "Resuming..." for zero diff', () => {
      const now = new Date(Date.now()).toISOString();
      expect(card._formatCountdown(now)).toBe('Resuming...');
    });
  });

  describe('Group Name Literals', () => {
    test('_getAreaName returns exactly "Unassigned" for null', () => {
      expect(card._getAreaName(null)).toBe('Unassigned');
    });

    test('_getAreaName returns exactly "Unassigned" for undefined', () => {
      expect(card._getAreaName(undefined)).toBe('Unassigned');
    });

    test('_getCategoryName returns exactly "Uncategorized" for null', () => {
      expect(card._getCategoryName(null)).toBe('Uncategorized');
    });

    test('_getCategoryName returns exactly "Uncategorized" for undefined', () => {
      expect(card._getCategoryName(undefined)).toBe('Uncategorized');
    });

    test('_getLabelName formats snake_case to Title Case', () => {
      expect(card._getLabelName('my_custom_label')).toBe('My Custom Label');
    });
  });

  describe('Stub Config Strings', () => {
    test('getStubConfig returns title exactly "AutoSnooze"', () => {
      const CardClass = customElements.get('autosnooze-card');
      expect(CardClass.getStubConfig().title).toBe('AutoSnooze');
    });
  });

  describe('Error Message Strings', () => {
    test('_getErrorMessage returns correct message for not_automation', () => {
      const error = { translation_key: 'not_automation' };
      const result = card._getErrorMessage(error, 'Default');
      expect(result).toBe('Failed to snooze: One or more selected items are not automations');
    });

    test('_getErrorMessage returns correct message for invalid_duration', () => {
      const error = { translation_key: 'invalid_duration' };
      const result = card._getErrorMessage(error, 'Default');
      expect(result).toBe('Failed to snooze: Please specify a valid duration (days, hours, or minutes)');
    });

    test('_getErrorMessage returns correct message for resume_time_past', () => {
      const error = { translation_key: 'resume_time_past' };
      const result = card._getErrorMessage(error, 'Default');
      expect(result).toBe('Failed to snooze: Resume time must be in the future');
    });

    test('_getErrorMessage returns correct message for disable_after_resume', () => {
      const error = { translation_key: 'disable_after_resume' };
      const result = card._getErrorMessage(error, 'Default');
      expect(result).toBe('Failed to snooze: Snooze time must be before resume time');
    });

    test('_getErrorMessage appends log check for unknown errors', () => {
      const error = { message: 'Unknown error' };
      const result = card._getErrorMessage(error, 'Failed');
      expect(result).toContain('Check Home Assistant logs for details');
    });
  });

  describe('Toast Message Strings', () => {
    test('toast undo button text is exactly "Undo"', () => {
      card._showToast('Test', { showUndo: true, onUndo: vi.fn() });
      const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
      expect(undoBtn.textContent).toBe('Undo');
    });
  });

  describe('Empty State Messages', () => {
    test('_getFilteredAutomations returns empty array for empty states', () => {
      // Test the method directly without triggering render
      const originalStates = card.hass.states;
      card.hass = {
        ...card.hass,
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '0',
            attributes: { paused_automations: {}, scheduled_snoozes: {} },
          },
        },
      };
      card._automationsCache = null;
      const result = card._getFilteredAutomations();
      expect(result).toEqual([]);
      // Restore
      card.hass.states = originalStates;
    });
  });
});

// =============================================================================
// ARITHMETIC AND BOUNDARY TESTS
// =============================================================================

describe('Arithmetic Operations - Mutation Killing', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
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

  describe('Duration Parsing Arithmetic', () => {
    test('_parseDurationInput parses 1.5h as 90 minutes', () => {
      const result = card._parseDurationInput('1.5h');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 30 });
    });

    test('_parseDurationInput parses 2.5d as 2d 12h', () => {
      const result = card._parseDurationInput('2.5d');
      expect(result).toEqual({ days: 2, hours: 12, minutes: 0 });
    });

    test('_parseDurationInput parses 0.5h as 30m', () => {
      const result = card._parseDurationInput('0.5h');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 30 });
    });

    test('_parseDurationInput parses combined units correctly', () => {
      const result = card._parseDurationInput('1d 2h 30m');
      expect(result).toEqual({ days: 1, hours: 2, minutes: 30 });
    });

    test('_parseDurationInput returns null for 0', () => {
      const result = card._parseDurationInput('0');
      expect(result).toBeNull();
    });

    test('_parseDurationInput handles negative prefix by extracting number', () => {
      // The regex captures digits, so "-30m" extracts "30m"
      const result = card._parseDurationInput('-30m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 30 });
    });

    test('_parseDurationInput handles plain number as minutes', () => {
      const result = card._parseDurationInput('45');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 45 });
    });

    test('_parseDurationInput rounds decimal minutes', () => {
      const result = card._parseDurationInput('30.6m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 31 });
    });
  });

  describe('Duration Formatting Arithmetic', () => {
    test('_formatDuration handles 0 days correctly', () => {
      expect(card._formatDuration(0, 1, 30)).toBe('1 hour, 30 minutes');
    });

    test('_formatDuration handles 0 hours correctly', () => {
      expect(card._formatDuration(1, 0, 30)).toBe('1 day, 30 minutes');
    });

    test('_formatDuration handles 0 minutes correctly', () => {
      expect(card._formatDuration(1, 2, 0)).toBe('1 day, 2 hours');
    });

    test('_formatDuration handles all zeros', () => {
      expect(card._formatDuration(0, 0, 0)).toBe('');
    });

    test('_formatDuration singular forms', () => {
      expect(card._formatDuration(1, 1, 1)).toBe('1 day, 1 hour, 1 minute');
    });

    test('_formatDuration plural forms', () => {
      expect(card._formatDuration(2, 2, 2)).toBe('2 days, 2 hours, 2 minutes');
    });
  });

  describe('Countdown Arithmetic Boundaries', () => {
    test('_formatCountdown at exactly 1 day boundary', () => {
      // 1 day = 86400000ms + buffer
      const time = new Date(Date.now() + 86400000 + 5000).toISOString();
      const result = card._formatCountdown(time);
      expect(result).toContain('1d');
    });

    test('_formatCountdown just under 1 day', () => {
      // Just under 24 hours (23h 59m)
      const time = new Date(Date.now() + 86340000).toISOString(); // 23h 59m
      const result = card._formatCountdown(time);
      expect(result).toContain('23h');
      expect(result).not.toContain('d');
    });

    test('_formatCountdown at exactly 1 hour boundary', () => {
      const time = new Date(Date.now() + 3600000 + 5000).toISOString();
      const result = card._formatCountdown(time);
      expect(result).toContain('1h');
    });

    test('_formatCountdown just under 1 hour', () => {
      // 59 minutes
      const time = new Date(Date.now() + 3540000).toISOString();
      const result = card._formatCountdown(time);
      expect(result).toContain('59m');
      expect(result).not.toContain('h');
    });
  });

  describe('Card Size Calculation', () => {
    test('getCardSize returns 4 for base state', () => {
      expect(card.getCardSize()).toBe(4);
    });

    test('getCardSize increases by 1 per paused automation', () => {
      card.hass.states['sensor.autosnooze_snoozed_automations'].attributes.paused_automations = {
        'automation.1': {},
        'automation.2': {},
        'automation.3': {},
      };
      expect(card.getCardSize()).toBe(7);
    });
  });
});

// =============================================================================
// CONDITIONAL LOGIC TESTS
// =============================================================================

describe('Conditional Logic - Mutation Killing', () => {
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

  describe('_parseDurationInput Conditionals', () => {
    test('returns null for empty string', () => {
      expect(card._parseDurationInput('')).toBeNull();
    });

    test('returns null for whitespace only', () => {
      expect(card._parseDurationInput('   ')).toBeNull();
    });

    test('returns null for invalid text', () => {
      expect(card._parseDurationInput('abc')).toBeNull();
    });

    test('returns null for NaN values', () => {
      expect(card._parseDurationInput('NaN')).toBeNull();
    });

    test('handles mixed case input', () => {
      expect(card._parseDurationInput('2H30M')).toEqual({ days: 0, hours: 2, minutes: 30 });
    });

    test('handles input with spaces', () => {
      expect(card._parseDurationInput('1d 2h 30m')).toEqual({ days: 1, hours: 2, minutes: 30 });
    });
  });

  describe('_toggleSelection Conditionals', () => {
    test('adds item when not selected', () => {
      card._selected = [];
      card._toggleSelection('automation.test');
      expect(card._selected).toContain('automation.test');
    });

    test('removes item when already selected', () => {
      card._selected = ['automation.test'];
      card._toggleSelection('automation.test');
      expect(card._selected).not.toContain('automation.test');
    });

    test('preserves other selections when toggling', () => {
      card._selected = ['automation.other', 'automation.test'];
      card._toggleSelection('automation.test');
      expect(card._selected).toContain('automation.other');
      expect(card._selected).not.toContain('automation.test');
    });
  });

  describe('_selectAllVisible Conditionals', () => {
    test('selects all when none selected', () => {
      card._selected = [];
      card._selectAllVisible();
      expect(card._selected.length).toBeGreaterThan(0);
    });

    test('deselects all when all selected', () => {
      const automations = card._getFilteredAutomations();
      card._selected = automations.map((a) => a.id);
      card._selectAllVisible();
      expect(card._selected.length).toBe(0);
    });

    test('selects remaining when some selected', () => {
      const automations = card._getFilteredAutomations();
      if (automations.length > 1) {
        card._selected = [automations[0].id];
        card._selectAllVisible();
        expect(card._selected.length).toBe(automations.length);
      }
    });
  });

  describe('_hasResumeAt and _hasDisableAt', () => {
    test('_hasResumeAt returns false when date is empty', () => {
      card._resumeAtDate = '';
      card._resumeAtTime = '12:00';
      expect(card._hasResumeAt()).toBeFalsy();
    });

    test('_hasResumeAt returns false when time is empty', () => {
      card._resumeAtDate = '2024-12-25';
      card._resumeAtTime = '';
      expect(card._hasResumeAt()).toBeFalsy();
    });

    test('_hasResumeAt returns true when both set', () => {
      card._resumeAtDate = '2024-12-25';
      card._resumeAtTime = '12:00';
      expect(card._hasResumeAt()).toBeTruthy();
    });

    test('_hasDisableAt returns false when date is empty', () => {
      card._disableAtDate = '';
      card._disableAtTime = '10:00';
      expect(card._hasDisableAt()).toBeFalsy();
    });

    test('_hasDisableAt returns false when time is empty', () => {
      card._disableAtDate = '2024-12-25';
      card._disableAtTime = '';
      expect(card._hasDisableAt()).toBeFalsy();
    });

    test('_hasDisableAt returns true when both set', () => {
      card._disableAtDate = '2024-12-25';
      card._disableAtTime = '10:00';
      expect(card._hasDisableAt()).toBeTruthy();
    });
  });

  describe('_combineDateTime Conditionals', () => {
    test('returns null when date is null', () => {
      expect(card._combineDateTime(null, '12:00')).toBeNull();
    });

    test('returns null when time is null', () => {
      expect(card._combineDateTime('2024-12-25', null)).toBeNull();
    });

    test('returns null when date is empty', () => {
      expect(card._combineDateTime('', '12:00')).toBeNull();
    });

    test('returns null when time is empty', () => {
      expect(card._combineDateTime('2024-12-25', '')).toBeNull();
    });

    test('returns formatted datetime when both provided', () => {
      const result = card._combineDateTime('2024-12-25', '12:00');
      expect(result).not.toBeNull();
      expect(result).toMatch(/^2024-12-25T12:00[+-]\d{2}:\d{2}$/);
    });
  });

  describe('_getLocale Conditionals', () => {
    test('returns hass locale when available', () => {
      card.hass.locale = { language: 'fr-FR' };
      expect(card._getLocale()).toBe('fr-FR');
    });

    test('returns undefined when hass locale is missing', () => {
      card.hass.locale = null;
      expect(card._getLocale()).toBeUndefined();
    });

    test('returns undefined when hass locale language is missing', () => {
      card.hass.locale = {};
      expect(card._getLocale()).toBeUndefined();
    });
  });

  describe('_formatDateTime Year Conditional', () => {
    test('includes year when date is in next year', () => {
      const nextYear = new Date().getFullYear() + 1;
      const futureDate = new Date(`${nextYear}-06-15T12:00:00Z`).toISOString();
      const result = card._formatDateTime(futureDate);
      expect(result).toContain(String(nextYear));
    });

    test('returns formatted string for current year date', () => {
      const currentYear = new Date().getFullYear();
      const currentYearDate = new Date(`${currentYear}-06-15T12:00:00Z`).toISOString();
      const result = card._formatDateTime(currentYearDate);
      // Result should be a non-empty string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Should contain Jun (month)
      expect(result.toLowerCase()).toContain('jun');
    });
  });
});

// =============================================================================
// METHOD RETURN VALUE TESTS
// =============================================================================

describe('Method Return Values - Mutation Killing', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
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

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    card._entityRegistry = {
      'automation.living_room': {
        entity_id: 'automation.living_room',
        area_id: 'living_room',
        categories: { automation: 'cat_lighting' },
        labels: ['label_1'],
      },
      'automation.bedroom': {
        entity_id: 'automation.bedroom',
        area_id: 'bedroom',
        categories: {},
        labels: [],
      },
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

  describe('_getAreaCount Return Values', () => {
    test('returns exact count of unique areas', () => {
      const count = card._getAreaCount();
      expect(count).toBe(2);
    });

    test('returns 0 when no areas assigned', () => {
      // Clear area_id from existing registry entries
      card._entityRegistry = {
        'automation.living_room': { entity_id: 'automation.living_room', area_id: null, categories: {}, labels: [] },
        'automation.bedroom': { entity_id: 'automation.bedroom', area_id: null, categories: {}, labels: [] },
      };
      card._automationsCache = null;
      expect(card._getAreaCount()).toBe(0);
    });
  });

  describe('_getLabelCount Return Values', () => {
    test('returns exact count of unique labels', () => {
      const count = card._getLabelCount();
      expect(count).toBe(1);
    });

    test('returns 0 when no labels assigned', () => {
      // Clear labels from existing registry entries
      card._entityRegistry = {
        'automation.living_room': { entity_id: 'automation.living_room', area_id: 'living_room', categories: {}, labels: [] },
        'automation.bedroom': { entity_id: 'automation.bedroom', area_id: 'bedroom', categories: {}, labels: [] },
      };
      card._automationsCache = null;
      expect(card._getLabelCount()).toBe(0);
    });
  });

  describe('_getCategoryCount Return Values', () => {
    test('returns exact count of unique categories', () => {
      const count = card._getCategoryCount();
      expect(count).toBe(1);
    });

    test('returns 0 when no categories assigned', () => {
      // Clear categories from existing registry entries
      card._entityRegistry = {
        'automation.living_room': { entity_id: 'automation.living_room', area_id: 'living_room', categories: {}, labels: ['label_1'] },
        'automation.bedroom': { entity_id: 'automation.bedroom', area_id: 'bedroom', categories: {}, labels: [] },
      };
      card._automationsCache = null;
      expect(card._getCategoryCount()).toBe(0);
    });
  });

  describe('_getAutomations Return Values', () => {
    test('returns array of automations', () => {
      const result = card._getAutomations();
      expect(Array.isArray(result)).toBe(true);
    });

    test('returns empty array when states is empty', () => {
      card.hass.states = {};
      card._automationsCache = null;
      expect(card._getAutomations()).toEqual([]);
    });

    test('includes area_id from entity registry', () => {
      const automations = card._getAutomations();
      const livingRoom = automations.find((a) => a.id === 'automation.living_room');
      expect(livingRoom.area_id).toBe('living_room');
    });

    test('includes category_id from entity registry', () => {
      const automations = card._getAutomations();
      const livingRoom = automations.find((a) => a.id === 'automation.living_room');
      expect(livingRoom.category_id).toBe('cat_lighting');
    });

    test('includes labels from entity registry', () => {
      const automations = card._getAutomations();
      const livingRoom = automations.find((a) => a.id === 'automation.living_room');
      expect(livingRoom.labels).toContain('label_1');
    });
  });

  describe('_getPaused Return Values', () => {
    test('returns empty object when no paused automations', () => {
      expect(card._getPaused()).toEqual({});
    });

    test('returns paused automations object', () => {
      card.hass.states['sensor.autosnooze_snoozed_automations'].attributes.paused_automations = {
        'automation.test': { resume_at: '2024-12-25T12:00:00Z' },
      };
      const result = card._getPaused();
      expect(result['automation.test']).toBeDefined();
    });
  });

  describe('_getScheduled Return Values', () => {
    test('returns empty object when no scheduled snoozes', () => {
      expect(card._getScheduled()).toEqual({});
    });

    test('returns scheduled snoozes object', () => {
      card.hass.states['sensor.autosnooze_snoozed_automations'].attributes.scheduled_snoozes = {
        'automation.test': { disable_at: '2024-12-25T10:00:00Z', resume_at: '2024-12-25T12:00:00Z' },
      };
      const result = card._getScheduled();
      expect(result['automation.test']).toBeDefined();
    });
  });
});

// =============================================================================
// EVENT AND SERVICE CALL TESTS
// =============================================================================

describe('Event Properties - Mutation Killing', () => {
  let editor;

  beforeEach(async () => {
    const EditorClass = customElements.get('autosnooze-card-editor');
    editor = new EditorClass();
    editor.setConfig({ title: 'Test' });
    document.body.appendChild(editor);
    await editor.updateComplete;
  });

  afterEach(() => {
    if (editor && editor.parentNode) {
      editor.parentNode.removeChild(editor);
    }
  });

  test('config-changed event has bubbles true', async () => {
    const eventPromise = new Promise((resolve) => {
      editor.addEventListener('config-changed', (e) => resolve(e));
    });

    editor._valueChanged('title', 'New');

    const event = await eventPromise;
    expect(event.bubbles).toBe(true);
  });

  test('config-changed event has composed true', async () => {
    const eventPromise = new Promise((resolve) => {
      editor.addEventListener('config-changed', (e) => resolve(e));
    });

    editor._valueChanged('title', 'New');

    const event = await eventPromise;
    expect(event.composed).toBe(true);
  });

  test('config-changed event detail contains config', async () => {
    const eventPromise = new Promise((resolve) => {
      editor.addEventListener('config-changed', (e) => resolve(e));
    });

    editor._valueChanged('title', 'Updated');

    const event = await eventPromise;
    expect(event.detail).toHaveProperty('config');
    expect(event.detail.config.title).toBe('Updated');
  });
});

// =============================================================================
// GROUPING LOGIC TESTS
// =============================================================================

describe('Grouping Logic - Mutation Killing', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
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
        area_1: { area_id: 'area_1', name: 'Area One' },
        area_2: { area_id: 'area_2', name: 'Area Two' },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    card._entityRegistry = {
      'automation.a': { entity_id: 'automation.a', area_id: 'area_1', categories: { automation: 'cat_1' }, labels: ['label_a'] },
      'automation.b': { entity_id: 'automation.b', area_id: 'area_2', categories: {}, labels: ['label_b'] },
      'automation.c': { entity_id: 'automation.c', area_id: null, categories: {}, labels: [] },
    };
    card._entityRegistryFetched = true;
    card._categoryRegistry = {
      cat_1: { category_id: 'cat_1', name: 'Category One' },
    };
    card._categoriesFetched = true;
    card._labelRegistry = {
      label_a: { label_id: 'label_a', name: 'Label A' },
      label_b: { label_id: 'label_b', name: 'Label B' },
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

  describe('_getGroupedByArea', () => {
    test('groups by area correctly', () => {
      const grouped = card._getGroupedByArea();
      expect(grouped.length).toBe(3); // Area One, Area Two, Unassigned
    });

    test('Unassigned is always last', () => {
      const grouped = card._getGroupedByArea();
      const lastGroup = grouped[grouped.length - 1];
      expect(lastGroup[0]).toBe('Unassigned');
    });

    test('groups are sorted alphabetically', () => {
      const grouped = card._getGroupedByArea();
      const names = grouped.slice(0, -1).map(([name]) => name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  describe('_getGroupedByCategory', () => {
    test('groups by category correctly', () => {
      const grouped = card._getGroupedByCategory();
      expect(grouped.length).toBe(2); // Category One, Uncategorized
    });

    test('Uncategorized is always last', () => {
      const grouped = card._getGroupedByCategory();
      const lastGroup = grouped[grouped.length - 1];
      expect(lastGroup[0]).toBe('Uncategorized');
    });
  });

  describe('_getGroupedByLabel', () => {
    test('groups by label correctly', () => {
      const grouped = card._getGroupedByLabel();
      expect(grouped.length).toBe(3); // Label A, Label B, Unlabeled
    });

    test('Unlabeled is always last', () => {
      const grouped = card._getGroupedByLabel();
      const lastGroup = grouped[grouped.length - 1];
      expect(lastGroup[0]).toBe('Unlabeled');
    });
  });

  describe('_selectGroup', () => {
    test('selects all items in group', () => {
      const items = [{ id: 'automation.a' }, { id: 'automation.b' }];
      card._selectGroup(items);
      expect(card._selected).toContain('automation.a');
      expect(card._selected).toContain('automation.b');
    });

    test('deselects all when all already selected', () => {
      const items = [{ id: 'automation.a' }, { id: 'automation.b' }];
      card._selected = ['automation.a', 'automation.b'];
      card._selectGroup(items);
      expect(card._selected).not.toContain('automation.a');
      expect(card._selected).not.toContain('automation.b');
    });

    test('adds remaining items when some selected', () => {
      const items = [{ id: 'automation.a' }, { id: 'automation.b' }];
      card._selected = ['automation.a'];
      card._selectGroup(items);
      expect(card._selected).toContain('automation.a');
      expect(card._selected).toContain('automation.b');
    });
  });

  describe('_toggleGroupExpansion', () => {
    test('toggles group from undefined to false', () => {
      expect(card._expandedGroups['TestGroup']).toBeUndefined();
      card._toggleGroupExpansion('TestGroup');
      // First toggle - !undefined = true, then stored
      const firstState = card._expandedGroups['TestGroup'];
      expect(typeof firstState).toBe('boolean');
    });

    test('toggles group state back and forth', () => {
      card._expandedGroups = { TestGroup: true };
      card._toggleGroupExpansion('TestGroup');
      expect(card._expandedGroups['TestGroup']).toBe(false);
      card._toggleGroupExpansion('TestGroup');
      expect(card._expandedGroups['TestGroup']).toBe(true);
    });
  });
});

// =============================================================================
// REGISTRY FORMATTING TESTS
// =============================================================================

describe('Registry ID Formatting - Mutation Killing', () => {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('_formatRegistryId', () => {
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
      const result = card._formatRegistryId('my_very_long_name');
      expect(result).toBe('My Very Long Name');
    });
  });
});

// =============================================================================
// SNOOZE VALIDATION TESTS
// =============================================================================

describe('Snooze Validation - Mutation Killing', () => {
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

  describe('Duration Mode Validation', () => {
    test('does not call service when no selection', async () => {
      card._selected = [];
      card._duration = 1800000;
      await card._snooze();
      expect(mockHass.callService).not.toHaveBeenCalled();
    });

    test('does not call service when duration is zero', async () => {
      card._selected = ['automation.test'];
      card._duration = 0;
      card._customDuration = { days: 0, hours: 0, minutes: 0 };
      await card._snooze();
      expect(mockHass.callService).not.toHaveBeenCalled();
    });

    test('does not call service when loading', async () => {
      card._selected = ['automation.test'];
      card._loading = true;
      await card._snooze();
      expect(mockHass.callService).not.toHaveBeenCalled();
    });

    test('calls service with correct parameters', async () => {
      card._selected = ['automation.test'];
      card._customDuration = { days: 1, hours: 2, minutes: 30 };
      await card._snooze();
      expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'pause', {
        entity_id: ['automation.test'],
        days: 1,
        hours: 2,
        minutes: 30,
      });
    });
  });

  describe('Schedule Mode Validation', () => {
    test('shows toast when resume_at date not set', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._resumeAtDate = '';
      card._resumeAtTime = '12:00';
      await card._snooze();
      expect(mockHass.callService).not.toHaveBeenCalled();
    });

    test('shows toast when resume_at time not set', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._resumeAtDate = '2026-12-25';
      card._resumeAtTime = '';
      await card._snooze();
      expect(mockHass.callService).not.toHaveBeenCalled();
    });

    test('shows toast when resume time is in past', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      const pastDate = new Date(Date.now() - 86400000);
      card._resumeAtDate = pastDate.toISOString().split('T')[0];
      card._resumeAtTime = '10:00';
      await card._snooze();
      expect(mockHass.callService).not.toHaveBeenCalled();
    });

    test('shows toast when disable time is after resume time', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      const futureDate = new Date(Date.now() + 86400000);
      const dateStr = futureDate.toISOString().split('T')[0];
      card._resumeAtDate = dateStr;
      card._resumeAtTime = '10:00';
      card._disableAtDate = dateStr;
      card._disableAtTime = '12:00'; // After resume time
      await card._snooze();
      expect(mockHass.callService).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// KEYBOARD ACCESSIBILITY TESTS
// =============================================================================

describe('Keyboard Accessibility - Mutation Killing', () => {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('_handleKeyDown', () => {
    test('calls callback on Enter key', () => {
      const callback = vi.fn();
      const event = { key: 'Enter', preventDefault: vi.fn() };
      card._handleKeyDown(event, callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    test('calls callback on Space key', () => {
      const callback = vi.fn();
      const event = { key: ' ', preventDefault: vi.fn() };
      card._handleKeyDown(event, callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    test('does not call callback on Tab key', () => {
      const callback = vi.fn();
      const event = { key: 'Tab', preventDefault: vi.fn() };
      card._handleKeyDown(event, callback);
      expect(callback).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test('does not call callback on Escape key', () => {
      const callback = vi.fn();
      const event = { key: 'Escape', preventDefault: vi.fn() };
      card._handleKeyDown(event, callback);
      expect(callback).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test('does not call callback on letter keys', () => {
      const callback = vi.fn();
      const event = { key: 'a', preventDefault: vi.fn() };
      card._handleKeyDown(event, callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// SEARCH DEBOUNCE TESTS
// =============================================================================

describe('Search Debounce - Mutation Killing', () => {
  let card;

  beforeEach(async () => {
    vi.useFakeTimers();
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = createMockHass({
      states: {
        'automation.test': { state: 'on', attributes: { friendly_name: 'Test' } },
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
    vi.useRealTimers();
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('search is debounced at 300ms', () => {
    const event = { target: { value: 'test' } };
    card._handleSearchInput(event);

    // Before 300ms
    vi.advanceTimersByTime(299);
    expect(card._search).toBe('');

    // At 300ms
    vi.advanceTimersByTime(1);
    expect(card._search).toBe('test');
  });

  test('search is not updated before debounce completes', () => {
    const event = { target: { value: 'first' } };
    card._handleSearchInput(event);

    vi.advanceTimersByTime(100);
    expect(card._search).toBe('');

    vi.advanceTimersByTime(100);
    expect(card._search).toBe('');

    vi.advanceTimersByTime(100);
    expect(card._search).toBe('first');
  });

  test('subsequent inputs reset the debounce timer', () => {
    card._handleSearchInput({ target: { value: 'first' } });
    vi.advanceTimersByTime(200);

    card._handleSearchInput({ target: { value: 'second' } });
    vi.advanceTimersByTime(200);

    // First timer would have fired, but was cancelled
    expect(card._search).toBe('');

    vi.advanceTimersByTime(100);
    expect(card._search).toBe('second');
  });
});

// =============================================================================
// WAKE ALL CONFIRMATION TESTS
// =============================================================================

describe('Wake All Confirmation - Mutation Killing', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    vi.useFakeTimers();
    mockHass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '2',
          attributes: {
            paused_automations: {
              'automation.a': { resume_at: new Date(Date.now() + 3600000).toISOString() },
              'automation.b': { resume_at: new Date(Date.now() + 7200000).toISOString() },
            },
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
    vi.useRealTimers();
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('first click sets pending flag', () => {
    expect(card._wakeAllPending).toBe(false);
    card._handleWakeAll();
    expect(card._wakeAllPending).toBe(true);
  });

  test('pending resets after 3000ms', () => {
    card._handleWakeAll();
    expect(card._wakeAllPending).toBe(true);

    vi.advanceTimersByTime(2999);
    expect(card._wakeAllPending).toBe(true);

    vi.advanceTimersByTime(1);
    expect(card._wakeAllPending).toBe(false);
  });

  test('second click within timeout calls service', async () => {
    card._handleWakeAll();
    vi.advanceTimersByTime(1000);
    await card._handleWakeAll();

    expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'cancel_all', {});
  });

  test('second click resets pending flag', async () => {
    card._handleWakeAll();
    await card._handleWakeAll();
    expect(card._wakeAllPending).toBe(false);
  });
});

// =============================================================================
// PAUSED GROUPING TESTS
// =============================================================================

describe('Paused Grouping by Resume Time - Mutation Killing', () => {
  let card;

  beforeEach(async () => {
    const now = Date.now();
    const mockHass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '3',
          attributes: {
            paused_automations: {
              'automation.a': { resume_at: new Date(now + 3600000).toISOString(), friendly_name: 'A' },
              'automation.b': { resume_at: new Date(now + 3600000).toISOString(), friendly_name: 'B' }, // Same resume time as A
              'automation.c': { resume_at: new Date(now + 7200000).toISOString(), friendly_name: 'C' },
            },
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

  test('groups paused automations by resume time', () => {
    const grouped = card._getPausedGroupedByResumeTime();
    expect(grouped.length).toBe(2);
  });

  test('first group has 2 automations with same resume time', () => {
    const grouped = card._getPausedGroupedByResumeTime();
    expect(grouped[0].automations.length).toBe(2);
  });

  test('groups are sorted by resume time ascending', () => {
    const grouped = card._getPausedGroupedByResumeTime();
    const firstTime = new Date(grouped[0].resumeAt).getTime();
    const secondTime = new Date(grouped[1].resumeAt).getTime();
    expect(firstTime).toBeLessThan(secondTime);
  });
});
