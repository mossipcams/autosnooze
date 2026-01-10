/**
 * Tests for User Flow 2: Waking Automations
 *
 * This file tests the waking (cancel) flow including:
 * - Wake individual automations via _wake method
 * - Wake All functionality with confirmation
 * - autosnooze.cancel service calls
 * - autosnooze.cancel_all service calls
 * - Undo functionality after snooze
 * - Rendering of paused automations with wake buttons
 */

import { vi } from 'vitest';
import '../src/index.js';

// =============================================================================
// WAKE ALL CONFIRMATION
// =============================================================================

describe('Wake All Confirmation', () => {
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

// =============================================================================
// WAKE OPERATIONS
// =============================================================================

describe('Wake Operations', () => {
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
});

// =============================================================================
// CANCEL SERVICE CALLS
// =============================================================================

describe('Cancel Service Calls', () => {
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

  describe('cancel service', () => {
    test('sends correct parameters for wake', async () => {
      await card._wake('automation.test');

      expect(mockCallService).toHaveBeenCalledTimes(1);
      expect(mockCallService).toHaveBeenCalledWith('autosnooze', 'cancel', {
        entity_id: 'automation.test',
      });
    });

    test('handles error during wake gracefully', async () => {
      mockCallService.mockRejectedValueOnce(new Error('Service unavailable'));

      await expect(card._wake('automation.test')).resolves.not.toThrow();
    });
  });

  describe('cancel_all service', () => {
    test('sends empty object for wake all', async () => {
      card._wakeAllPending = true;
      await card._handleWakeAll();

      expect(mockCallService).toHaveBeenCalledTimes(1);
      expect(mockCallService).toHaveBeenCalledWith('autosnooze', 'cancel_all', {});
      expect(card._wakeAllPending).toBe(false);
    });

    test('first click sets pending state without calling service', async () => {
      card._wakeAllPending = false;
      await card._handleWakeAll();

      expect(mockCallService).not.toHaveBeenCalled();
      expect(card._wakeAllPending).toBe(true);
    });
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
    card._selected = ['automation.test'];
    card._scheduleMode = true;
    card._disableAtDate = '2026-01-15';
    card._disableAtTime = '10:00';
    card._resumeAtDate = '2026-01-15';
    card._resumeAtTime = '12:00';

    await card._snooze();

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

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
// RENDERING WITH PAUSED AUTOMATIONS
// =============================================================================

describe('Rendering with Paused Automations', () => {
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
});
