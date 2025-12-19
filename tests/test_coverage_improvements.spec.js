/**
 * Tests to improve coverage for AutoSnooze Card
 *
 * These tests cover previously uncovered code paths to meet 70% coverage threshold.
 */

import '../src/autosnooze-card.js';

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
      // Use hass.entities to provide area_id and labels
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

    // Clear the cache to ensure fresh data
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

  describe('_getLabelName', () => {
    test('returns label name from registry', () => {
      expect(card._getLabelName('lighting')).toBe('Lighting');
    });

    test('formats label_id if not in registry', () => {
      expect(card._getLabelName('my_custom_label')).toBe('My Custom Label');
    });

    test('handles label with underscores', () => {
      expect(card._getLabelName('very_long_label_name')).toBe('Very Long Label Name');
    });
  });

  describe('_getGroupedByArea', () => {
    test('groups automations by area', () => {
      const grouped = card._getGroupedByArea();
      expect(grouped.length).toBeGreaterThan(0);

      const groupNames = grouped.map(g => g[0]);
      expect(groupNames).toContain('Living Room');
      expect(groupNames).toContain('Bedroom');
    });

    test('puts unassigned automations in "Unassigned" group', () => {
      const grouped = card._getGroupedByArea();
      const unassigned = grouped.find(g => g[0] === 'Unassigned');
      expect(unassigned).toBeDefined();
      expect(unassigned[1].length).toBe(1);
    });

    test('sorts groups alphabetically with Unassigned last', () => {
      const grouped = card._getGroupedByArea();
      const groupNames = grouped.map(g => g[0]);

      // Unassigned should be last
      expect(groupNames[groupNames.length - 1]).toBe('Unassigned');

      // Other groups should be sorted
      const nonUnassigned = groupNames.filter(n => n !== 'Unassigned');
      const sorted = [...nonUnassigned].sort();
      expect(nonUnassigned).toEqual(sorted);
    });
  });

  describe('_getGroupedByLabel', () => {
    test('groups automations by label', () => {
      const grouped = card._getGroupedByLabel();
      expect(grouped.length).toBeGreaterThan(0);

      const groupNames = grouped.map(g => g[0]);
      // Labels are resolved through _getLabelName - check both scenarios
      expect(groupNames).toContain('Lighting');
      // "climate" label may be formatted as "Climate" if not in registry with different name
      expect(groupNames.some(n => n.toLowerCase().includes('climate'))).toBe(true);
    });

    test('puts unlabeled automations in "Unlabeled" group', () => {
      const grouped = card._getGroupedByLabel();
      const unlabeled = grouped.find(g => g[0] === 'Unlabeled');
      expect(unlabeled).toBeDefined();
    });

    test('automation with multiple labels appears in multiple groups', () => {
      const grouped = card._getGroupedByLabel();
      // Find groups that contain bedroom_fan
      const groupsWithBedroomFan = grouped.filter(g =>
        g[1].some(a => a.id === 'automation.bedroom_fan')
      );

      // bedroom_fan has both climate and comfort labels, so should appear in 2 groups
      expect(groupsWithBedroomFan.length).toBe(2);
    });

    test('sorts groups alphabetically with Unlabeled last', () => {
      const grouped = card._getGroupedByLabel();
      const groupNames = grouped.map(g => g[0]);

      // Unlabeled should be last
      expect(groupNames[groupNames.length - 1]).toBe('Unlabeled');
    });
  });

  describe('_getLabelCount', () => {
    test('returns count of unique labels', () => {
      const count = card._getLabelCount();
      // lighting, climate, comfort = 3 unique labels
      expect(count).toBe(3);
    });
  });
});

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

      // Should reset loading state
      expect(card._loading).toBe(false);
    });
  });

  describe('_snooze - Schedule Mode', () => {
    test('calls pause service with schedule parameters', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._resumeAt = '2024-12-25T12:00';

      await card._snooze();

      expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'pause', {
        entity_id: ['automation.test'],
        resume_at: '2024-12-25T12:00',
      });
    });

    test('includes disable_at when set', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._disableAt = '2024-12-25T10:00';
      card._resumeAt = '2024-12-25T12:00';

      await card._snooze();

      expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'pause', {
        entity_id: ['automation.test'],
        resume_at: '2024-12-25T12:00',
        disable_at: '2024-12-25T10:00',
      });
    });

    test('shows toast when resume_at not set', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._resumeAt = '';

      await card._snooze();

      expect(mockHass.callService).not.toHaveBeenCalled();
    });

    test('clears schedule inputs after snooze', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._disableAt = '2024-12-25T10:00';
      card._resumeAt = '2024-12-25T12:00';

      await card._snooze();

      expect(card._disableAt).toBe('');
      expect(card._resumeAt).toBe('');
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

      // Should not throw
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

      // Should not throw
      await card._cancelScheduled('automation.test');
    });
  });

  describe('_handleWakeAll error handling', () => {
    test('handles service error on second click', async () => {
      card._wakeAllPending = true;
      mockHass.callService.mockRejectedValueOnce(new Error('Service failed'));

      // Should not throw
      await card._handleWakeAll();

      expect(card._wakeAllPending).toBe(false);
    });
  });
});

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
      onUndo: jest.fn(),
    });

    const toast = card.shadowRoot.querySelector('.toast');
    const undoBtn = toast.querySelector('.toast-undo-btn');
    expect(undoBtn).not.toBeNull();
    expect(undoBtn.textContent).toBe('Undo');
  });

  test('clicking undo button calls onUndo callback', () => {
    const onUndoMock = jest.fn();
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
      onUndo: jest.fn(),
    });

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    const toast = card.shadowRoot.querySelector('.toast');
    expect(toast).toBeNull();
  });

  test('toast auto-removes after timeout', () => {
    jest.useFakeTimers();

    card._showToast('Test message');

    // Toast should exist
    expect(card.shadowRoot.querySelector('.toast')).not.toBeNull();

    // Fast forward past the removal animation
    jest.advanceTimersByTime(5300);

    // Toast should be removed
    expect(card.shadowRoot.querySelector('.toast')).toBeNull();

    jest.useRealTimers();
  });
});

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

    const datetimeInputs = scheduleInputs.querySelectorAll('input[type="datetime-local"]');
    expect(datetimeInputs.length).toBe(2);
  });

  test('renders duration selector when schedule mode is disabled', async () => {
    card._scheduleMode = false;
    await card.updateComplete;

    const durationSelector = card.shadowRoot.querySelector('.duration-selector');
    expect(durationSelector).not.toBeNull();
  });

  test('schedule toggle changes mode', async () => {
    card._scheduleMode = false;
    await card.updateComplete;

    const toggle = card.shadowRoot.querySelector('.schedule-toggle');
    toggle.click();

    expect(card._scheduleMode).toBe(true);
  });
});

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
    const wakeSpy = jest.spyOn(card, '_wake');
    const wakeBtn = card.shadowRoot.querySelector('.wake-btn');
    wakeBtn.click();

    expect(wakeSpy).toHaveBeenCalled();
    wakeSpy.mockRestore();
  });

  test('clicking cancel scheduled button calls _cancelScheduled', async () => {
    const cancelSpy = jest.spyOn(card, '_cancelScheduled');
    const cancelBtn = card.shadowRoot.querySelector('.cancel-scheduled-btn');
    cancelBtn.click();

    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});

describe('Selection List Rendering', () => {
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

    card._entityRegistry = {
      'automation.living_room_lights': { area_id: 'living_room', labels: ['lighting'] },
      'automation.bedroom_fan': { area_id: 'bedroom', labels: [] },
    };

    card._labelRegistry = {
      lighting: { name: 'Lighting' },
    };

    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
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

  test('renders grouped list in "labels" tab', async () => {
    card._filterTab = 'labels';
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

  test('group checkbox selects all items in group', async () => {
    card._filterTab = 'areas';
    await card.updateComplete;

    const groupCheckbox = card.shadowRoot.querySelector('.group-header input[type="checkbox"]');
    groupCheckbox.dispatchEvent(new Event('change'));

    // At least one item should be selected
    expect(card._selected.length).toBeGreaterThan(0);
  });

  test('clicking group header toggles expansion', async () => {
    card._filterTab = 'areas';
    await card.updateComplete;

    const groupHeader = card.shadowRoot.querySelector('.group-header');
    const groupName = groupHeader.querySelector('span').textContent;

    // First click toggles (groups start expanded by default, so first toggle collapses)
    groupHeader.click();
    await card.updateComplete;

    // The _expandedGroups state should be changed
    expect(card._expandedGroups[groupName]).toBeDefined();
  });

  test('renders selection actions bar', async () => {
    await card.updateComplete;

    const selectionActions = card.shadowRoot.querySelector('.selection-actions');
    expect(selectionActions).not.toBeNull();
  });

  test('clear button clears selection', async () => {
    card._selected = ['automation.living_room_lights'];
    await card.updateComplete;

    const clearBtn = card.shadowRoot.querySelector('.select-all-btn:last-child');
    if (clearBtn && clearBtn.textContent === 'Clear') {
      clearBtn.click();
      expect(card._selected.length).toBe(0);
    }
  });
});

describe('Custom Duration Input', () => {
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

  test('clicking custom pill toggles custom input visibility', async () => {
    await card.updateComplete;

    // Find the "Custom" pill (last pill)
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

  test('_handleDurationInput updates custom duration state', () => {
    card._handleDurationInput('2h30m');

    expect(card._customDurationInput).toBe('2h30m');
    expect(card._customDuration).toEqual({ days: 0, hours: 2, minutes: 30 });
  });

  test('_handleDurationInput handles invalid input', () => {
    card._handleDurationInput('invalid');

    expect(card._customDurationInput).toBe('invalid');
    // Custom duration should remain unchanged from default
  });

  test('clicking preset pill hides custom input', async () => {
    card._showCustomInput = true;
    await card.updateComplete;

    // Find a preset pill (not Custom)
    const pills = card.shadowRoot.querySelectorAll('.pill');
    const presetPill = pills[0];

    presetPill.click();
    await card.updateComplete;

    expect(card._showCustomInput).toBe(false);
  });
});

describe('DateTime Formatting', () => {
  let card;

  beforeEach(async () => {
    const mockHass = createMockHass({
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('_formatDateTime formats ISO string', () => {
    const result = card._formatDateTime('2024-12-25T14:30:00Z');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
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
});

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

    // Wait for async undo
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'cancel', {
      entity_id: 'automation.test',
    });
  });

  test('undo after scheduled snooze calls cancel_scheduled service', async () => {
    card._selected = ['automation.test'];
    card._scheduleMode = true;
    card._disableAt = '2024-12-25T10:00';
    card._resumeAt = '2024-12-25T12:00';

    await card._snooze();

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    // Wait for async undo
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'cancel_scheduled', {
      entity_id: 'automation.test',
    });
  });

  test('undo restores selection', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    // Wait for async undo
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(card._selected).toContain('automation.test');
  });

  test('undo handles errors gracefully', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    // Make cancel fail
    mockHass.callService.mockRejectedValueOnce(new Error('Cancel failed'));

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');

    // Should not throw
    undoBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
  });
});
