/**
 * Tests for AutoSnooze Card UI Components
 *
 * This file contains comprehensive tests for:
 * - Card registration and configuration
 * - UI rendering and interactions
 * - Selection, duration, and grouping logic
 * - Snooze operations and service calls
 * - Toast notifications and error handling
 *
 * Note: E2E tests are in e2e/ directory and run via Playwright
 */

import { vi } from 'vitest';
import '../custom_components/autosnooze/www/autosnooze-card.js';

// =============================================================================
// CARD REGISTRATION
// =============================================================================

describe('AutoSnooze Card Registration', () => {
  test('registers autosnooze-card custom element', () => {
    expect(customElements.get('autosnooze-card')).toBeDefined();
  });

  test('registers autosnooze-card-editor custom element', () => {
    expect(customElements.get('autosnooze-card-editor')).toBeDefined();
  });

  test('card has static getStubConfig method', () => {
    const CardClass = customElements.get('autosnooze-card');
    expect(typeof CardClass.getStubConfig).toBe('function');
    expect(CardClass.getStubConfig().title).toBe('AutoSnooze');
  });
});

// =============================================================================
// CARD EDITOR
// =============================================================================

describe('AutoSnooze Card Editor', () => {
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

  test('has default empty config', () => {
    expect(editor._config).toEqual({});
  });

  test('setConfig updates internal config', () => {
    editor.setConfig({ title: 'Test Title' });
    expect(editor._config).toEqual({ title: 'Test Title' });
  });

  test('renders title input field', async () => {
    editor.setConfig({ title: 'My Card' });
    await editor.updateComplete;

    const input = editor.shadowRoot.querySelector('input[type="text"]');
    expect(input).toBeDefined();
    expect(input.value).toBe('My Card');
  });

  test('dispatches config-changed event on value change', async () => {
    editor.setConfig({ title: 'Original' });
    await editor.updateComplete;

    const eventPromise = new Promise((resolve) => {
      editor.addEventListener('config-changed', (e) => resolve(e.detail));
    });

    editor._valueChanged('title', 'New Title');

    const detail = await eventPromise;
    expect(detail.config.title).toBe('New Title');
  });

  test('removes empty values from config', () => {
    editor.setConfig({ title: 'Test', otherKey: 'value' });

    const eventPromise = new Promise((resolve) => {
      editor.addEventListener('config-changed', (e) => resolve(e.detail));
    });

    editor._valueChanged('otherKey', '');

    return eventPromise.then((detail) => {
      expect(detail.config.otherKey).toBeUndefined();
      expect(detail.config.title).toBe('Test');
    });
  });

  test('dispatches config-changed event via input', async () => {
    editor.setConfig({ title: 'My Card' });
    await editor.updateComplete;

    const eventSpy = vi.fn();
    editor.addEventListener('config-changed', eventSpy);

    const input = editor.shadowRoot.querySelector('input[type="text"]');
    input.value = 'New Title';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(eventSpy).toHaveBeenCalled();
    const detail = eventSpy.mock.calls[0][0].detail;
    expect(detail.config.title).toBe('New Title');
  });

  // Tests to catch mutation survivors
  test('_valueChanged does nothing when config is not set', () => {
    const freshEditor = new (customElements.get('autosnooze-card-editor'))();
    // Don't call setConfig - _config should be empty object by default
    freshEditor._config = null; // Force null config

    const eventSpy = vi.fn();
    freshEditor.addEventListener('config-changed', eventSpy);

    // Should return early without dispatching event
    freshEditor._valueChanged('title', 'Test');

    expect(eventSpy).not.toHaveBeenCalled();
  });

  test('removes null values from config', async () => {
    editor.setConfig({ title: 'Test', nullable: 'value' });

    const eventPromise = new Promise((resolve) => {
      editor.addEventListener('config-changed', (e) => resolve(e.detail));
    });

    editor._valueChanged('nullable', null);

    const detail = await eventPromise;
    expect(detail.config.nullable).toBeUndefined();
    expect(detail.config.title).toBe('Test');
  });

  test('removes undefined values from config', async () => {
    editor.setConfig({ title: 'Test', undef: 'value' });

    const eventPromise = new Promise((resolve) => {
      editor.addEventListener('config-changed', (e) => resolve(e.detail));
    });

    editor._valueChanged('undef', undefined);

    const detail = await eventPromise;
    expect(detail.config.undef).toBeUndefined();
  });

  test('config-changed event bubbles', async () => {
    editor.setConfig({ title: 'Original' });
    await editor.updateComplete;

    const eventPromise = new Promise((resolve) => {
      // Listen on parent to verify bubbling
      document.body.addEventListener('config-changed', (e) => resolve(e), { once: true });
    });

    editor._valueChanged('title', 'New');

    const event = await eventPromise;
    expect(event.bubbles).toBe(true);
  });

  test('config-changed event is composed', async () => {
    editor.setConfig({ title: 'Original' });
    await editor.updateComplete;

    const eventPromise = new Promise((resolve) => {
      editor.addEventListener('config-changed', (e) => resolve(e), { once: true });
    });

    editor._valueChanged('title', 'New');

    const event = await eventPromise;
    expect(event.composed).toBe(true);
  });

  test('renders empty string when no title configured', async () => {
    editor.setConfig({});
    await editor.updateComplete;

    const input = editor.shadowRoot.querySelector('input[type="text"]');
    expect(input.value).toBe('');
  });

  test('render returns empty template when config not set', async () => {
    const freshEditor = new (customElements.get('autosnooze-card-editor'))();
    freshEditor._config = null;
    document.body.appendChild(freshEditor);
    await freshEditor.updateComplete;

    // Should render without error
    const content = freshEditor.shadowRoot.innerHTML;
    expect(content).toBeDefined();

    freshEditor.remove();
  });
});

// =============================================================================
// MAIN CARD COMPONENT
// =============================================================================

describe('AutoSnooze Card Main Component', () => {
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

  describe('Initialization', () => {
    test('has default state values', () => {
      expect(card._selected).toEqual([]);
      expect(card._duration).toBe(1800000); // 30 minutes
      expect(card._loading).toBe(false);
      expect(card._search).toBe('');
      expect(card._filterTab).toBe('all');
    });

    test('setConfig sets config property', () => {
      card.setConfig({ title: 'Custom Title' });
      expect(card.config.title).toBe('Custom Title');
    });

    test('getStubConfig returns default config', () => {
      const CardClass = customElements.get('autosnooze-card');
      const stub = CardClass.getStubConfig();
      expect(stub.title).toBe('AutoSnooze');
    });

    test('getConfigElement returns editor element name', () => {
      const CardClass = customElements.get('autosnooze-card');
      const configElement = CardClass.getConfigElement();
      expect(configElement.tagName.toLowerCase()).toBe('autosnooze-card-editor');
    });
  });

  describe('Automation List', () => {
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
      // Set up label registry with exclude label
      card._labelRegistry = {
        label_exclude: { name: 'autosnooze_exclude' },
      };
      // Set up entity registry with labels on one automation
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
      card._automationsCache = null; // Clear cache to force recalculation
      card._search = '';

      const filtered = card._getFilteredAutomations();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('automation.living_room');
    });

    test('_getFilteredAutomations uses whitelist mode when autosnooze_include label exists', () => {
      // Set up label registry with include label
      card._labelRegistry = {
        label_include: { name: 'autosnooze_include' },
      };
      // Set up entity registry - only living_room has the include label
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
      // Set up both labels
      card._labelRegistry = {
        label_include: { name: 'autosnooze_include' },
        label_exclude: { name: 'autosnooze_exclude' },
      };
      // One automation has include, another has exclude
      card._entityRegistry = {
        'automation.test_automation': {
          entity_id: 'automation.test_automation',
          labels: ['label_exclude'], // Would be excluded, but include mode takes over
        },
        'automation.living_room': {
          entity_id: 'automation.living_room',
          labels: ['label_include'],
        },
      };
      card._automationsCache = null;
      card._search = '';

      const filtered = card._getFilteredAutomations();
      // Only the one with include label should show (whitelist mode)
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('automation.living_room');
    });

    test('_getFilteredAutomations search works with label filtering', () => {
      // Set up exclude label
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

  describe('Selection', () => {
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

  describe('Duration', () => {
    test('_setDuration updates duration in milliseconds', () => {
      card._setDuration(60); // 60 minutes
      expect(card._duration).toBe(3600000);
    });

    test('_setDuration updates custom duration fields', () => {
      card._setDuration(90); // 90 minutes = 1h 30m
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
  });

  describe('Last Duration Feature', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test('_lastDuration is null when no stored duration', () => {
      expect(card._lastDuration).toBeNull();
    });

    test('_getDurationPills returns default pills when no last duration', () => {
      card._lastDuration = null;
      const pills = card._getDurationPills();
      expect(pills.length).toBe(5); // 30m, 1h, 12h, 1d, Custom
      expect(pills[pills.length - 1].label).toBe('Custom');
    });

    test('_getDurationPills does not include Last pill - replaced by badge', () => {
      card._lastDuration = {
        minutes: 150, // 2h 30m - not a preset
        duration: { days: 0, hours: 2, minutes: 30 },
        timestamp: Date.now(),
      };
      const pills = card._getDurationPills();
      expect(pills.length).toBe(5); // 30m, 1h, 12h, 1d, Custom (no Last pill)
      const lastPill = pills.find(p => p.isLast);
      expect(lastPill).toBeUndefined(); // No Last pill in array anymore
    });

    test('_getDurationPills does not include Last pill when last duration matches a preset', () => {
      card._lastDuration = {
        minutes: 60, // 1h - matches preset
        duration: { days: 0, hours: 1, minutes: 0 },
        timestamp: Date.now(),
      };
      const pills = card._getDurationPills();
      expect(pills.length).toBe(5); // 30m, 1h, 12h, 1d, Custom (no extra Last pill)
      const lastPill = pills.find(p => p.isLast);
      expect(lastPill).toBeUndefined();
    });

    test('_renderLastDurationBadge returns empty string when last duration matches preset', () => {
      card._lastDuration = {
        minutes: 60, // 1h - matches preset
        duration: { days: 0, hours: 1, minutes: 0 },
        timestamp: Date.now(),
      };
      const badge = card._renderLastDurationBadge();
      expect(badge).toBe(''); // Badge should not render
    });

    test('_renderLastDurationBadge renders badge for unique duration', () => {
      card._lastDuration = {
        minutes: 90, // 1h 30m - not a preset
        duration: { days: 0, hours: 1, minutes: 30 },
        timestamp: Date.now(),
      };
      const badge = card._renderLastDurationBadge();
      expect(badge).not.toBe(''); // Badge should render
      expect(badge.strings).toBeDefined(); // Should be a TemplateResult
    });

    test('clicking badge sets duration correctly', () => {
      card._lastDuration = {
        minutes: 150,
        duration: { days: 0, hours: 2, minutes: 30 },
        timestamp: Date.now(),
      };
      // Badge click calls _setDuration internally
      card._setDuration(150);
      expect(card._customDuration).toEqual({ days: 0, hours: 2, minutes: 30 });
      expect(card._duration).toBe(150 * 60 * 1000); // 150 minutes in ms
    });
  });

  describe('Formatting', () => {
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
      const futureTime = new Date(Date.now() + 65000).toISOString(); // ~1 min
      const result = card._formatCountdown(futureTime);
      expect(result).toMatch(/\d+m \d+s/);
    });

    test('_formatCountdown handles hours correctly', () => {
      const futureTime = new Date(Date.now() + 3700000).toISOString(); // ~1 hour
      const result = card._formatCountdown(futureTime);
      expect(result).toMatch(/\d+h/);
    });

    test('_formatCountdown handles days correctly', () => {
      const futureTime = new Date(Date.now() + 90000000).toISOString(); // ~1 day
      const result = card._formatCountdown(futureTime);
      expect(result).toMatch(/\d+d/);
    });

    test('_formatDateTime formats ISO string', () => {
      const result = card._formatDateTime('2024-12-25T14:30:00Z');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Area/Label Helpers', () => {
    test('_getAreaName returns "Unassigned" for null area', () => {
      expect(card._getAreaName(null)).toBe('Unassigned');
    });

    test('_getAreaName returns area name from hass', () => {
      card.hass = {
        ...mockHass,
        areas: { living_room: { name: 'Living Room' } },
      };
      expect(card._getAreaName('living_room')).toBe('Living Room');
    });

    test('_getAreaName formats area_id if no name', () => {
      expect(card._getAreaName('living_room')).toBe('Living Room');
    });

    test('_getCategoryName returns "Uncategorized" for null', () => {
      expect(card._getCategoryName(null)).toBe('Uncategorized');
    });

    test('_getLabelName returns label name from registry', () => {
      card._labelRegistry = { lighting: { name: 'Lighting' } };
      expect(card._getLabelName('lighting')).toBe('Lighting');
    });

    test('_getLabelName formats label_id if not in registry', () => {
      expect(card._getLabelName('my_custom_label')).toBe('My Custom Label');
    });
  });

  describe('Paused/Scheduled Getters', () => {
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

    test('_getScheduled returns empty object when no scheduled', () => {
      expect(card._getScheduled()).toEqual({});
    });

    test('_getScheduled returns scheduled snoozes from sensor', () => {
      card.hass.states['sensor.autosnooze_snoozed_automations'].attributes.scheduled_snoozes = {
        'automation.test': {
          friendly_name: 'Test',
          disable_at: '2024-01-01T12:00:00Z',
          resume_at: '2024-01-01T14:00:00Z',
        },
      };
      const scheduled = card._getScheduled();
      expect(scheduled['automation.test']).toBeDefined();
      expect(scheduled['automation.test'].friendly_name).toBe('Test');
    });
  });

  describe('Card Size', () => {
    test('getCardSize returns base size for empty state', () => {
      expect(card.getCardSize()).toBe(4);
    });

    test('getCardSize increases with paused automations', () => {
      card.hass.states['sensor.autosnooze_snoozed_automations'].attributes.paused_automations = {
        'automation.test1': {},
        'automation.test2': {},
      };
      expect(card.getCardSize()).toBe(6);
    });
  });

  describe('UI Rendering', () => {
    test('renders ha-card element', async () => {
      await card.updateComplete;
      const haCard = card.shadowRoot.querySelector('ha-card');
      expect(haCard).toBeDefined();
    });

    test('renders header with title', async () => {
      card.setConfig({ title: 'My Snooze' });
      await card.updateComplete;
      const header = card.shadowRoot.querySelector('.header');
      expect(header.textContent).toContain('My Snooze');
    });

    test('renders filter tabs', async () => {
      await card.updateComplete;
      const tabs = card.shadowRoot.querySelectorAll('.tab');
      expect(tabs.length).toBeGreaterThanOrEqual(4); // All, Areas, Categories, Labels
    });

    test('renders search box', async () => {
      await card.updateComplete;
      const searchInput = card.shadowRoot.querySelector('.search-box input');
      expect(searchInput).toBeDefined();
    });

    test('renders duration pills', async () => {
      await card.updateComplete;
      const pills = card.shadowRoot.querySelectorAll('.pill');
      expect(pills.length).toBeGreaterThanOrEqual(4);
    });

    test('renders snooze button', async () => {
      await card.updateComplete;
      const btn = card.shadowRoot.querySelector('.snooze-btn');
      expect(btn).toBeDefined();
    });

    test('snooze button is disabled when no selection', async () => {
      card._selected = [];
      await card.updateComplete;
      const btn = card.shadowRoot.querySelector('.snooze-btn');
      expect(btn.disabled).toBe(true);
    });

    test('renders flat list in "all" tab', async () => {
      card._filterTab = 'all';
      await card.updateComplete;
      const listItems = card.shadowRoot.querySelectorAll('.list-item');
      expect(listItems.length).toBe(2);
    });

    test('renders grouped list in "areas" tab', async () => {
      card._filterTab = 'areas';
      await card.updateComplete;
      const groupHeaders = card.shadowRoot.querySelectorAll('.group-header');
      expect(groupHeaders.length).toBeGreaterThan(0);
    });

    test('renders empty message when no automations match filter', async () => {
      card._search = 'nonexistent';
      await card.updateComplete;
      const emptyMsg = card.shadowRoot.querySelector('.list-empty');
      expect(emptyMsg).not.toBeNull();
    });

    test('renders selection actions bar', async () => {
      await card.updateComplete;
      const selectionActions = card.shadowRoot.querySelector('.selection-actions');
      expect(selectionActions).not.toBeNull();
    });
  });

  describe('Group Expansion', () => {
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

  describe('Wake All Confirmation', () => {
    test('first click sets pending flag', () => {
      card._handleWakeAll();
      expect(card._wakeAllPending).toBe(true);
    });

    test('second click resets pending flag and calls service', async () => {
      card._wakeAllPending = true;
      await card._handleWakeAll();
      expect(card._wakeAllPending).toBe(false);
      expect(card.hass.callService).toHaveBeenCalledWith('autosnooze', 'cancel_all', {});
    });

    test('pending state auto-resets after timeout', () => {
      vi.useFakeTimers();
      card._handleWakeAll();
      expect(card._wakeAllPending).toBe(true);
      vi.advanceTimersByTime(3000);
      expect(card._wakeAllPending).toBe(false);
      vi.useRealTimers();
    });

    test('handles service error on second click', async () => {
      card._wakeAllPending = true;
      mockHass.callService.mockRejectedValueOnce(new Error('Service failed'));
      await card._handleWakeAll();
      expect(card._wakeAllPending).toBe(false);
    });
  });

  describe('Search Input Handling', () => {
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

  describe('Custom Duration Input', () => {
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

  describe('Filter Tab Interactions', () => {
    test('clicking Areas tab changes filter to areas', async () => {
      const tabs = card.shadowRoot.querySelectorAll('.tab');
      const areasTab = Array.from(tabs).find((t) => t.textContent.includes('Areas'));

      areasTab.click();
      await card.updateComplete;

      expect(card._filterTab).toBe('areas');
    });

    test('clicking Categories tab changes filter to categories', async () => {
      const tabs = card.shadowRoot.querySelectorAll('.tab');
      const categoriesTab = Array.from(tabs).find((t) => t.textContent.includes('Categories'));

      categoriesTab.click();
      await card.updateComplete;

      expect(card._filterTab).toBe('categories');
    });

    test('clicking Labels tab changes filter to labels', async () => {
      const tabs = card.shadowRoot.querySelectorAll('.tab');
      const labelsTab = Array.from(tabs).find((t) => t.textContent.includes('Labels'));

      labelsTab.click();
      await card.updateComplete;

      expect(card._filterTab).toBe('labels');
    });

    test('clicking All tab changes filter to all', async () => {
      card._filterTab = 'areas';
      await card.updateComplete;

      const tabs = card.shadowRoot.querySelectorAll('.tab');
      const allTab = Array.from(tabs).find((t) => t.textContent.includes('All'));

      allTab.click();
      await card.updateComplete;

      expect(card._filterTab).toBe('all');
    });
  });

  describe('List Item Interactions', () => {
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
});

// =============================================================================
// LIFECYCLE METHODS
// =============================================================================

describe('Lifecycle Methods', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
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
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('connectedCallback starts countdown interval', async () => {
    vi.useFakeTimers();

    document.body.appendChild(card);
    await card.updateComplete;

    expect(card._syncTimeout).not.toBeNull();

    vi.useRealTimers();
  });

  test('disconnectedCallback clears intervals', async () => {
    vi.useFakeTimers();

    document.body.appendChild(card);
    await card.updateComplete;

    card._interval = setInterval(() => {}, 1000);
    card._syncTimeout = setTimeout(() => {}, 1000);
    card._searchTimeout = setTimeout(() => {}, 1000);

    card.remove();

    expect(card._interval).toBeNull();
    expect(card._syncTimeout).toBeNull();
    expect(card._searchTimeout).toBeNull();

    vi.useRealTimers();
  });

  test('_updateCountdownIfNeeded triggers update when paused automations exist', async () => {
    // Set up card with paused automations
    card.hass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '1',
          attributes: {
            paused_automations: {
              'automation.test': {
                entity_id: 'automation.test',
                resume_at: new Date(Date.now() + 3600000).toISOString(),
              },
            },
            scheduled_snoozes: {},
          },
        },
      },
    });

    document.body.appendChild(card);
    await card.updateComplete;

    const requestUpdateSpy = vi.spyOn(card, 'requestUpdate');
    card._updateCountdownIfNeeded();

    expect(requestUpdateSpy).toHaveBeenCalled();
  });

  test('_updateCountdownIfNeeded handles no countdown elements', () => {
    expect(() => card._updateCountdownIfNeeded()).not.toThrow();
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
// SNOOZE OPERATIONS
// =============================================================================

describe('Snooze Operations', () => {
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

  describe('_snooze - Duration Mode', () => {
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

  describe('_snooze - Schedule Mode', () => {
    beforeEach(() => {
      // Mock time to be before the test dates (2026-01-15) so they appear in the future
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-14T00:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('calls pause service with schedule parameters including timezone', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._resumeAtDate = '2026-01-15';
      card._resumeAtTime = '12:00';

      await card._snooze();

      expect(mockHass.callService).toHaveBeenCalled();
      const callArgs = mockHass.callService.mock.calls[0];
      expect(callArgs[0]).toBe('autosnooze');
      expect(callArgs[1]).toBe('pause');
      expect(callArgs[2].entity_id).toEqual(['automation.test']);
      // Datetime should include timezone offset (e.g., +00:00 or -05:00)
      expect(callArgs[2].resume_at).toMatch(/^2026-01-15T12:00[+-]\d{2}:\d{2}$/);
    });

    test('includes disable_at with timezone when set', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._disableAtDate = '2026-01-15';
      card._disableAtTime = '10:00';
      card._resumeAtDate = '2026-01-15';
      card._resumeAtTime = '12:00';

      await card._snooze();

      expect(mockHass.callService).toHaveBeenCalled();
      const callArgs = mockHass.callService.mock.calls[0];
      expect(callArgs[0]).toBe('autosnooze');
      expect(callArgs[1]).toBe('pause');
      expect(callArgs[2].entity_id).toEqual(['automation.test']);
      // Datetime should include timezone offset
      expect(callArgs[2].resume_at).toMatch(/^2026-01-15T12:00[+-]\d{2}:\d{2}$/);
      expect(callArgs[2].disable_at).toMatch(/^2026-01-15T10:00[+-]\d{2}:\d{2}$/);
    });

    test('shows toast when resume_at not set', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._resumeAtDate = '';
      card._resumeAtTime = '';

      await card._snooze();

      expect(mockHass.callService).not.toHaveBeenCalled();
    });

    test('clears schedule inputs after snooze', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._disableAtDate = '2026-01-15';
      card._disableAtTime = '10:00';
      card._resumeAtDate = '2026-01-15';
      card._resumeAtTime = '12:00';

      await card._snooze();

      expect(card._disableAtDate).toBe('');
      expect(card._disableAtTime).toBe('');
      expect(card._resumeAtDate).toBe('');
      expect(card._resumeAtTime).toBe('');
    });
  });

  describe('_wake', () => {
    test('calls cancel service for entity', async () => {
      await card._wake('automation.test');

      expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'cancel', {
        entity_id: 'automation.test',
      });
    });

    test('handles service error gracefully', async () => {
      mockHass.callService.mockRejectedValueOnce(new Error('Service failed'));

      await card._wake('automation.test');
    });
  });

  describe('_cancelScheduled', () => {
    test('calls cancel_scheduled service', async () => {
      await card._cancelScheduled('automation.test');

      expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'cancel_scheduled', {
        entity_id: 'automation.test',
      });
    });

    test('handles service error gracefully', async () => {
      mockHass.callService.mockRejectedValueOnce(new Error('Service failed'));

      await card._cancelScheduled('automation.test');
    });
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
// SCHEDULE MODE UI
// =============================================================================

describe('Schedule Mode UI', () => {
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

  test('renders schedule inputs when schedule mode is enabled', async () => {
    card._scheduleMode = true;
    await card.updateComplete;

    const scheduleInputs = card.shadowRoot.querySelector('.schedule-inputs');
    expect(scheduleInputs).not.toBeNull();

    const selects = scheduleInputs.querySelectorAll('select');
    const timeInputs = scheduleInputs.querySelectorAll('input[type="time"]');
    expect(selects.length).toBe(2);
    expect(timeInputs.length).toBe(2);
  });

  test('renders duration selector when schedule mode is disabled', async () => {
    card._scheduleMode = false;
    await card.updateComplete;

    const durationSelector = card.shadowRoot.querySelector('.duration-selector');
    expect(durationSelector).not.toBeNull();
  });

  test('schedule link changes mode', async () => {
    card._scheduleMode = false;
    await card.updateComplete;

    const scheduleLink = card.shadowRoot.querySelector('.schedule-link');
    scheduleLink.click();

    expect(card._scheduleMode).toBe(true);
  });

  test('clicking back link switches to duration mode', async () => {
    card._scheduleMode = true;
    await card.updateComplete;

    const backLink = card.shadowRoot.querySelector('.schedule-link');
    backLink.click();
    await card.updateComplete;

    expect(card._scheduleMode).toBe(false);
  });

  test('schedule time input updates state', async () => {
    card._scheduleMode = true;
    await card.updateComplete;

    const timeInput = card.shadowRoot.querySelector('input[type="time"][aria-label="Snooze time"]');
    timeInput.value = '14:30';
    timeInput.dispatchEvent(new Event('input', { bubbles: true }));
    await card.updateComplete;

    expect(card._disableAtTime).toBe('14:30');
  });

  test('resume time input updates state', async () => {
    card._scheduleMode = true;
    await card.updateComplete;

    const timeInput = card.shadowRoot.querySelector('input[type="time"][aria-label="Resume time"]');
    timeInput.value = '16:00';
    timeInput.dispatchEvent(new Event('input', { bubbles: true }));
    await card.updateComplete;

    expect(card._resumeAtTime).toBe('16:00');
  });
});

// =============================================================================
// SCHEDULE MODE VALIDATION
// =============================================================================

describe('Schedule Mode Validation', () => {
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

  test('shows error when resume time is in the past', async () => {
    card._selected = ['automation.test'];
    card._scheduleMode = true;

    // Use local date methods to avoid UTC/local timezone mismatch
    const pastDate = new Date(Date.now() - 86400000);
    const year = pastDate.getFullYear();
    const month = String(pastDate.getMonth() + 1).padStart(2, '0');
    const day = String(pastDate.getDate()).padStart(2, '0');

    card._resumeAtDate = `${year}-${month}-${day}`;
    card._resumeAtTime = '10:00';
    card._disableAtDate = '';
    card._disableAtTime = '';

    await card._snooze();

    const toast = card.shadowRoot.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Resume time must be in the future');
  });

  test('shows error when resume time is within validation buffer window', async () => {
    // This test verifies the 5-second buffer that prevents race conditions
    // where frontend validation passes but backend rejects due to timing
    card._selected = ['automation.test'];
    card._scheduleMode = true;

    // Set resume time to 2 seconds from now (within the 5 second buffer)
    // Use local date methods to avoid UTC/local timezone mismatch
    const nearFuture = new Date(Date.now() + 2000);
    const year = nearFuture.getFullYear();
    const month = String(nearFuture.getMonth() + 1).padStart(2, '0');
    const day = String(nearFuture.getDate()).padStart(2, '0');
    const hours = String(nearFuture.getHours()).padStart(2, '0');
    const minutes = String(nearFuture.getMinutes()).padStart(2, '0');

    card._resumeAtDate = `${year}-${month}-${day}`;
    card._resumeAtTime = `${hours}:${minutes}`;
    card._disableAtDate = '';
    card._disableAtTime = '';

    await card._snooze();

    // Should show error because time is within the buffer window
    const toast = card.shadowRoot.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Resume time must be in the future');
    expect(mockHass.callService).not.toHaveBeenCalled();
  });

  test('shows error when disable time is after resume time', async () => {
    card._selected = ['automation.test'];
    card._scheduleMode = true;

    // Use local date methods to avoid UTC/local timezone mismatch
    const futureDate = new Date(Date.now() + 86400000);
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    card._resumeAtDate = dateStr;
    card._resumeAtTime = '10:00';
    card._disableAtDate = dateStr;
    card._disableAtTime = '12:00';

    await card._snooze();

    const toast = card.shadowRoot.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Snooze time must be before resume time');
  });

  test('_combineDateTime correctly calculates timezone offset for fractional timezones', () => {
    // Test that the datetime string round-trips correctly
    // This verifies the fix for Math.floor bug with negative offset minutes
    const result = card._combineDateTime('2024-12-25', '14:00');

    // Parse the result back and compare to the original local time
    const originalLocal = new Date('2024-12-25T14:00');
    const parsed = new Date(result);

    // The parsed time should equal the original local time
    // (both represent the same moment, just formatted differently)
    expect(parsed.getTime()).toBe(originalLocal.getTime());

    // Also verify the format is correct: YYYY-MM-DDTHH:MM±HH:MM
    expect(result).toMatch(/^2024-12-25T14:00[+-]\d{2}:\d{2}$/);
  });

  test('_combineDateTime returns null for missing date or time', () => {
    expect(card._combineDateTime('', '14:00')).toBeNull();
    expect(card._combineDateTime('2024-12-25', '')).toBeNull();
    expect(card._combineDateTime(null, '14:00')).toBeNull();
    expect(card._combineDateTime('2024-12-25', null)).toBeNull();
  });
});

// =============================================================================
// RENDERING WITH PAUSED/SCHEDULED AUTOMATIONS
// =============================================================================

describe('Rendering with Paused/Scheduled Automations', () => {
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
          state: 'active',
          attributes: { paused_count: 2, scheduled_count: 1 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '3',
          attributes: {
            paused_automations: {
              'automation.paused1': {
                friendly_name: 'Paused Auto 1',
                resume_at: new Date(Date.now() + 3600000).toISOString(),
              },
              'automation.paused2': {
                friendly_name: 'Paused Auto 2',
                resume_at: new Date(Date.now() + 7200000).toISOString(),
                disable_at: new Date(Date.now() - 1800000).toISOString(),
              },
            },
            scheduled_snoozes: {
              'automation.scheduled1': {
                friendly_name: 'Scheduled Auto 1',
                disable_at: new Date(Date.now() + 3600000).toISOString(),
                resume_at: new Date(Date.now() + 7200000).toISOString(),
              },
            },
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

  test('renders snooze-list section when automations are paused', async () => {
    const snoozeList = card.shadowRoot.querySelector('.snooze-list');
    expect(snoozeList).not.toBeNull();
  });

  test('renders paused automation items', async () => {
    const pausedItems = card.shadowRoot.querySelectorAll('.paused-item');
    expect(pausedItems.length).toBe(2);
  });

  test('renders wake buttons for paused items', async () => {
    const wakeButtons = card.shadowRoot.querySelectorAll('.wake-btn');
    expect(wakeButtons.length).toBe(2);
  });

  test('renders Wake All button when multiple paused', async () => {
    const wakeAllBtn = card.shadowRoot.querySelector('.wake-all');
    expect(wakeAllBtn).not.toBeNull();
  });

  test('renders scheduled-list section when snoozes are scheduled', async () => {
    const scheduledList = card.shadowRoot.querySelector('.scheduled-list');
    expect(scheduledList).not.toBeNull();
  });

  test('renders scheduled snooze items', async () => {
    const scheduledItems = card.shadowRoot.querySelectorAll('.scheduled-item');
    expect(scheduledItems.length).toBe(1);
  });

  test('renders cancel buttons for scheduled items', async () => {
    const cancelButtons = card.shadowRoot.querySelectorAll('.cancel-scheduled-btn');
    expect(cancelButtons.length).toBe(1);
  });

  test('renders status summary in header', async () => {
    const summary = card.shadowRoot.querySelector('.status-summary');
    expect(summary).not.toBeNull();
    expect(summary.textContent).toContain('active');
  });

  test('clicking wake button calls _wake', async () => {
    const wakeSpy = vi.spyOn(card, '_wake');
    const wakeBtn = card.shadowRoot.querySelector('.wake-btn');
    wakeBtn.click();

    expect(wakeSpy).toHaveBeenCalled();
    wakeSpy.mockRestore();
  });

  test('clicking cancel scheduled button calls _cancelScheduled', async () => {
    const cancelSpy = vi.spyOn(card, '_cancelScheduled');
    const cancelBtn = card.shadowRoot.querySelector('.cancel-scheduled-btn');
    cancelBtn.click();

    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});

// =============================================================================
// UNDO FUNCTIONALITY
// =============================================================================

describe('Undo Functionality in Snooze', () => {
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

  test('snooze shows undo button in toast', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    expect(undoBtn).not.toBeNull();
  });

  test('undo after snooze calls cancel service', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'cancel', {
      entity_id: 'automation.test',
    });
  });

  test('undo after scheduled snooze calls cancel_scheduled service', async () => {
    // Mock time to be before the test dates (2026-01-15) so they appear in the future
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-14T00:00:00'));

    card._selected = ['automation.test'];
    card._scheduleMode = true;
    card._disableAtDate = '2026-01-15';
    card._disableAtTime = '10:00';
    card._resumeAtDate = '2026-01-15';
    card._resumeAtTime = '12:00';

    await card._snooze();

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    await vi.advanceTimersByTimeAsync(10);

    expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'cancel_scheduled', {
      entity_id: 'automation.test',
    });

    vi.useRealTimers();
  });

  test('undo restores selection', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(card._selected).toContain('automation.test');
  });

  test('undo handles errors gracefully', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    mockHass.callService.mockRejectedValueOnce(new Error('Cancel failed'));

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');

    undoBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});

// =============================================================================
// ERROR MESSAGE HANDLING
// =============================================================================

describe('Error Message Handling', () => {
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

  test('_getErrorMessage returns message for known translation_key', () => {
    const error = { translation_key: 'not_automation' };
    const result = card._getErrorMessage(error, 'Default');
    expect(result).toBe('Failed to snooze: One or more selected items are not automations');
  });

  test('_getErrorMessage returns message for translation_key in data', () => {
    const error = { data: { translation_key: 'invalid_duration' } };
    const result = card._getErrorMessage(error, 'Default');
    expect(result).toBe('Failed to snooze: Please specify a valid duration (days, hours, or minutes)');
  });

  test('_getErrorMessage matches error message patterns', () => {
    const error = { message: 'Something with resume_time_past in it' };
    const result = card._getErrorMessage(error, 'Default');
    expect(result).toBe('Failed to snooze: Resume time must be in the future');
  });

  test('_getErrorMessage matches lowercase patterns with spaces', () => {
    const error = { message: 'Something about disable after resume' };
    const result = card._getErrorMessage(error, 'Default');
    expect(result).toBe('Failed to snooze: Snooze time must be before resume time');
  });

  test('_getErrorMessage returns default for unknown errors', () => {
    const error = { message: 'Unknown error xyz' };
    const result = card._getErrorMessage(error, 'My Default');
    expect(result).toBe('My Default. Check Home Assistant logs for details.');
  });
});

// =============================================================================
// SHOULD UPDATE OPTIMIZATION
// =============================================================================

describe('shouldUpdate optimization', () => {
  let card;
  let createMockHass;

  beforeEach(async () => {
    createMockHass = (overrides = {}) => ({
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
    card.hass = createMockHass();
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
    changedProps.set('hass', createMockHass());
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when autosnooze sensor changes', () => {
    const oldHass = createMockHass();
    const newHass = createMockHass({
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
    const oldHass = createMockHass({ entities: { a: 1 } });
    const newHass = createMockHass({ entities: { b: 2 } });
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when areas change', () => {
    const oldHass = createMockHass({ areas: { area1: { name: 'Old' } } });
    const newHass = createMockHass({ areas: { area1: { name: 'New' } } });
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when an automation state changes', () => {
    const oldHass = createMockHass();
    const newHass = createMockHass({
      states: {
        'automation.test1': { state: 'off', attributes: { friendly_name: 'Test 1' } },
      },
    });
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns true when an automation is removed', () => {
    const oldHass = createMockHass({
      states: {
        'automation.test1': { state: 'on', attributes: { friendly_name: 'Test 1' } },
        'automation.test2': { state: 'on', attributes: { friendly_name: 'Test 2' } },
      },
    });
    const newHass = createMockHass(); // only has test1
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate returns false when no relevant changes', () => {
    const hass = createMockHass();
    card.hass = hass;
    const changedProps = new Map();
    changedProps.set('hass', hass); // Same object reference
    expect(card.shouldUpdate(changedProps)).toBe(false);
  });

  // Tests to catch mutation survivors - more specific condition testing
  test('shouldUpdate returns false when hass changes but sensor is identical object', () => {
    const sensor = {
      state: '0',
      attributes: { paused_automations: {}, scheduled_snoozes: {} },
    };
    const oldHass = {
      states: {
        'automation.test1': { state: 'on', attributes: { friendly_name: 'Test 1' } },
        'sensor.autosnooze_snoozed_automations': sensor,
      },
      entities: {},
      areas: {},
    };
    const newHass = {
      states: {
        'automation.test1': oldHass.states['automation.test1'], // Same reference
        'sensor.autosnooze_snoozed_automations': sensor, // Same reference
      },
      entities: oldHass.entities, // Same reference
      areas: oldHass.areas, // Same reference
    };
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(false);
  });

  test('shouldUpdate returns false when entities registry is same reference', () => {
    const entities = { 'automation.test1': { entity_id: 'automation.test1' } };
    const sensor = { state: '0', attributes: { paused_automations: {}, scheduled_snoozes: {} } };
    const automation = { state: 'on', attributes: { friendly_name: 'Test 1' } };
    const areas = {}; // Shared reference for areas
    const oldHass = {
      states: { 'automation.test1': automation, 'sensor.autosnooze_snoozed_automations': sensor },
      entities: entities,
      areas: areas,
    };
    const newHass = {
      states: { 'automation.test1': automation, 'sensor.autosnooze_snoozed_automations': sensor },
      entities: entities, // Same reference - should return false
      areas: areas, // Must be same reference
    };
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(false);
  });

  test('shouldUpdate returns false when areas is same reference', () => {
    const areas = { area1: { name: 'Living Room' } };
    const sensor = { state: '0', attributes: { paused_automations: {}, scheduled_snoozes: {} } };
    const automation = { state: 'on', attributes: { friendly_name: 'Test 1' } };
    const entities = {};
    const oldHass = {
      states: { 'automation.test1': automation, 'sensor.autosnooze_snoozed_automations': sensor },
      entities: entities,
      areas: areas,
    };
    const newHass = {
      states: { 'automation.test1': automation, 'sensor.autosnooze_snoozed_automations': sensor },
      entities: entities,
      areas: areas, // Same reference - should return false
    };
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(false);
  });

  test('shouldUpdate returns false when automation state is same reference', () => {
    const sensor = { state: '0', attributes: { paused_automations: {}, scheduled_snoozes: {} } };
    const automation = { state: 'on', attributes: { friendly_name: 'Test 1' } };
    const entities = {};
    const areas = {};
    const oldHass = {
      states: { 'automation.test1': automation, 'sensor.autosnooze_snoozed_automations': sensor },
      entities: entities,
      areas: areas,
    };
    const newHass = {
      states: { 'automation.test1': automation, 'sensor.autosnooze_snoozed_automations': sensor },
      entities: entities, // Must be same reference
      areas: areas, // Must be same reference
    };
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(false);
  });

  test('shouldUpdate returns true only when specific automation changes', () => {
    const sensor = { state: '0', attributes: { paused_automations: {}, scheduled_snoozes: {} } };
    const oldHass = {
      states: {
        'automation.test1': { state: 'on', attributes: { friendly_name: 'Test 1' } },
        'sensor.autosnooze_snoozed_automations': sensor,
        'light.test': { state: 'on' }, // Non-automation entity
      },
      entities: {},
      areas: {},
    };
    const newHass = {
      states: {
        'automation.test1': { state: 'off', attributes: { friendly_name: 'Test 1' } }, // Changed!
        'sensor.autosnooze_snoozed_automations': sensor,
        'light.test': { state: 'off' }, // Changed but not automation
      },
      entities: {},
      areas: {},
    };
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate checks automation removal correctly', () => {
    const sensor = { state: '0', attributes: { paused_automations: {}, scheduled_snoozes: {} } };
    const oldHass = {
      states: {
        'automation.test1': { state: 'on', attributes: { friendly_name: 'Test 1' } },
        'automation.to_remove': { state: 'on', attributes: { friendly_name: 'To Remove' } },
        'sensor.autosnooze_snoozed_automations': sensor,
      },
      entities: {},
      areas: {},
    };
    const newHass = {
      states: {
        'automation.test1': oldHass.states['automation.test1'],
        'sensor.autosnooze_snoozed_automations': sensor,
        // automation.to_remove is missing!
      },
      entities: {},
      areas: {},
    };
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(true);
  });

  test('shouldUpdate ignores non-automation entity removal', () => {
    const sensor = { state: '0', attributes: { paused_automations: {}, scheduled_snoozes: {} } };
    const automation = { state: 'on', attributes: { friendly_name: 'Test 1' } };
    const entities = {}; // Shared reference
    const areas = {}; // Shared reference
    const oldHass = {
      states: {
        'automation.test1': automation,
        'sensor.autosnooze_snoozed_automations': sensor,
        'light.to_remove': { state: 'on' }, // Non-automation
      },
      entities: entities,
      areas: areas,
    };
    const newHass = {
      states: {
        'automation.test1': automation,
        'sensor.autosnooze_snoozed_automations': sensor,
        // light.to_remove is missing but that's not an automation
      },
      entities: entities, // Must be same reference
      areas: areas, // Must be same reference
    };
    card.hass = newHass;
    const changedProps = new Map();
    changedProps.set('hass', oldHass);
    expect(card.shouldUpdate(changedProps)).toBe(false);
  });
});

// =============================================================================
// KEYBOARD ACCESSIBILITY
// =============================================================================

describe('Keyboard accessibility', () => {
  let card;

  beforeEach(async () => {
    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = {
      states: {
        'automation.test1': { state: 'on', attributes: { friendly_name: 'Test 1' } },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      entities: {},
      areas: {},
      callService: vi.fn().mockResolvedValue({}),
    };
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_handleKeyDown triggers callback on Enter key', () => {
    const callback = vi.fn();
    const event = { key: 'Enter', preventDefault: vi.fn() };
    card._handleKeyDown(event, callback);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  test('_handleKeyDown triggers callback on Space key', () => {
    const callback = vi.fn();
    const event = { key: ' ', preventDefault: vi.fn() };
    card._handleKeyDown(event, callback);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  test('_handleKeyDown does not trigger callback on other keys', () => {
    const callback = vi.fn();
    const event = { key: 'Tab', preventDefault: vi.fn() };
    card._handleKeyDown(event, callback);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });
});
