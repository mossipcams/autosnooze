/**
 * Tests for User Flow 4: Scheduled Snoozes
 *
 * This file tests the scheduled snooze flow including:
 * - Schedule mode UI rendering and interactions
 * - disable_at and resume_at datetime handling
 * - Timezone-aware datetime combination
 * - Schedule validation (past time, order of times)
 * - autosnooze.cancel_scheduled service calls
 * - Scheduled snooze rendering and cancellation
 */

import { vi } from 'vitest';
import '../src/index.js';

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
    card._selected = ['automation.test'];
    card._scheduleMode = true;

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

    const toast = card.shadowRoot.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Resume time must be in the future');
    expect(mockHass.callService).not.toHaveBeenCalled();
  });

  test('shows error when disable time is after resume time', async () => {
    card._selected = ['automation.test'];
    card._scheduleMode = true;

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
    const result = card._combineDateTime('2024-12-25', '14:00');

    const originalLocal = new Date('2024-12-25T14:00');
    const parsed = new Date(result);

    expect(parsed.getTime()).toBe(originalLocal.getTime());
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
// SNOOZE - SCHEDULE MODE
// =============================================================================

describe('Snooze - Schedule Mode', () => {
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

// =============================================================================
// CANCEL SCHEDULED
// =============================================================================

describe('Cancel Scheduled', () => {
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

// =============================================================================
// CANCEL SCHEDULED SERVICE CALLS
// =============================================================================

describe('Cancel Scheduled Service Calls', () => {
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

  test('sends correct parameters', async () => {
    await card._cancelScheduled('automation.test');

    expect(mockCallService).toHaveBeenCalledTimes(1);
    expect(mockCallService).toHaveBeenCalledWith('autosnooze', 'cancel_scheduled', {
      entity_id: 'automation.test',
    });
  });

  test('handles error during cancel_scheduled gracefully', async () => {
    mockCallService.mockRejectedValueOnce(new Error('Service unavailable'));

    await expect(card._cancelScheduled('automation.test')).resolves.not.toThrow();
  });
});

// =============================================================================
// SCHEDULED SNOOZE GETTERS
// =============================================================================

describe('Scheduled Snooze Getters', () => {
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

// =============================================================================
// RENDERING WITH SCHEDULED AUTOMATIONS
// =============================================================================

describe('Rendering with Scheduled Automations', () => {
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
          attributes: { paused_count: 0, scheduled_count: 1 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '1',
          attributes: {
            paused_automations: {},
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

  test('clicking cancel scheduled button calls _cancelScheduled', async () => {
    const cancelSpy = vi.spyOn(card, '_cancelScheduled');
    const cancelBtn = card.shadowRoot.querySelector('.cancel-scheduled-btn');
    cancelBtn.click();

    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});

// =============================================================================
// SCHEDULED SNOOZE STATE FROM BACKEND
// =============================================================================

describe('Scheduled Snooze State from Backend', () => {
  let card;

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
    card = null;
    vi.clearAllMocks();
  });

  function getFutureISODateTime(hoursFromNow = 1) {
    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
  }

  test('handles sensor state with scheduled snoozes', async () => {
    const scheduledSnoozes = {
      'automation.morning_routine': {
        entity_id: 'automation.morning_routine',
        friendly_name: 'Morning Routine',
        disable_at: getFutureISODateTime(4),
        resume_at: getFutureISODateTime(12),
      },
    };

    const mockHass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '1',
          attributes: {
            paused_automations: {},
            scheduled_snoozes: scheduledSnoozes,
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

    const scheduled = card._getScheduled();
    expect(Object.keys(scheduled).length).toBe(1);
    expect(scheduled['automation.morning_routine']).toBeDefined();
    expect(scheduled['automation.morning_routine'].disable_at).toBeDefined();
    expect(scheduled['automation.morning_routine'].resume_at).toBeDefined();
  });

  test('scheduled snooze has expected structure from backend', async () => {
    const scheduledSnoozes = {
      'automation.morning_routine': {
        entity_id: 'automation.morning_routine',
        friendly_name: 'Morning Routine',
        disable_at: getFutureISODateTime(4),
        resume_at: getFutureISODateTime(12),
      },
    };

    const mockHass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '1',
          attributes: {
            paused_automations: {},
            scheduled_snoozes: scheduledSnoozes,
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

    const scheduled = card._getScheduled();
    const snooze = scheduled['automation.morning_routine'];

    expect(snooze.entity_id).toBe('automation.morning_routine');
    expect(snooze.friendly_name).toBe('Morning Routine');
    expect(snooze.disable_at).toBeDefined();
    expect(snooze.resume_at).toBeDefined();
  });
});
