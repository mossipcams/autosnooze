/**
 * Tests for AutoSnooze Card UI Components
 *
 * These tests import and execute the actual source code for real coverage.
 */

// Import the actual source module to get coverage
import '../src/autosnooze-card.js';

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

    // Simulate _valueChanged
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
});

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

    test('_formatCountdown returns "Waking up..." for past time', () => {
      const pastTime = new Date(Date.now() - 10000).toISOString();
      expect(card._formatCountdown(pastTime)).toBe('Waking up...');
    });

    test('_formatCountdown formats future time correctly', () => {
      const futureTime = new Date(Date.now() + 65000).toISOString(); // ~1 min
      const result = card._formatCountdown(futureTime);
      expect(result).toMatch(/\d+m \d+s/);
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
  });

  describe('Group Expansion', () => {
    test('_toggleGroupExpansion toggles group state', () => {
      expect(card._expandedGroups['Test']).toBeUndefined();
      card._toggleGroupExpansion('Test');
      // After first toggle, check it's defined
      expect(card._expandedGroups['Test']).toBeDefined();
      const firstState = card._expandedGroups['Test'];
      card._toggleGroupExpansion('Test');
      // After second toggle, it should be opposite
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
    test('_showWakeAllConfirmDialog sets confirm flag', () => {
      card._showWakeAllConfirmDialog();
      expect(card._showWakeAllConfirm).toBe(true);
    });

    test('_cancelWakeAllConfirm resets confirm flag', () => {
      card._showWakeAllConfirm = true;
      card._cancelWakeAllConfirm();
      expect(card._showWakeAllConfirm).toBe(false);
    });
  });

  describe('Search Input Handling', () => {
    test('_handleSearchInput debounces search updates', async () => {
      jest.useFakeTimers();

      const event = { target: { value: 'test' } };
      card._handleSearchInput(event);

      // Search should not update immediately
      expect(card._search).toBe('');

      // Fast forward debounce timeout
      jest.advanceTimersByTime(350);

      expect(card._search).toBe('test');

      jest.useRealTimers();
    });
  });
});

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
    jest.useFakeTimers();

    document.body.appendChild(card);
    await card.updateComplete;

    // Should have set up sync timeout
    expect(card._syncTimeout).not.toBeNull();

    jest.useRealTimers();
  });

  test('disconnectedCallback clears intervals', async () => {
    document.body.appendChild(card);
    await card.updateComplete;

    // Set up mock interval and timeout
    card._interval = setInterval(() => {}, 1000);
    card._syncTimeout = setTimeout(() => {}, 1000);
    card._searchTimeout = setTimeout(() => {}, 1000);

    card.remove();

    expect(card._interval).toBeNull();
    expect(card._syncTimeout).toBeNull();
    expect(card._searchTimeout).toBeNull();
  });
});
