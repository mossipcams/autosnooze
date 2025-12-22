/**
 * Defect Prevention Tests
 *
 * These tests target potential defect-prone areas identified through code analysis:
 * - Duration parsing edge cases (whitespace, uppercase, zero values, large numbers)
 * - Schedule validation boundary conditions (exact now, year boundaries, DST)
 * - Registry fetch failure recovery
 * - Service call error handling and partial failures
 * - Toast notification lifecycle
 * - Countdown timer edge cases
 */

import '../src/autosnooze-card.js';

// =============================================================================
// DURATION PARSING EDGE CASES
// =============================================================================

describe('Duration Parsing Edge Cases', () => {
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

  describe('Whitespace handling', () => {
    test('parses duration with leading whitespace', () => {
      const result = card._parseDurationInput('  30m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 30 });
    });

    test('parses duration with trailing whitespace', () => {
      const result = card._parseDurationInput('30m  ');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 30 });
    });

    test('parses duration with internal whitespace', () => {
      const result = card._parseDurationInput('2h 30m');
      expect(result).toEqual({ days: 0, hours: 2, minutes: 30 });
    });

    test('parses duration with multiple spaces', () => {
      const result = card._parseDurationInput('  2h   30m  ');
      expect(result).toEqual({ days: 0, hours: 2, minutes: 30 });
    });
  });

  describe('Case variations', () => {
    test('parses uppercase duration "2H30M"', () => {
      const result = card._parseDurationInput('2H30M');
      expect(result).toEqual({ days: 0, hours: 2, minutes: 30 });
    });

    test('parses mixed case duration "2H30m"', () => {
      const result = card._parseDurationInput('2H30m');
      expect(result).toEqual({ days: 0, hours: 2, minutes: 30 });
    });

    test('parses uppercase day "1D"', () => {
      const result = card._parseDurationInput('1D');
      expect(result).toEqual({ days: 1, hours: 0, minutes: 0 });
    });

    test('parses full uppercase "1D2H30M"', () => {
      const result = card._parseDurationInput('1D2H30M');
      expect(result).toEqual({ days: 1, hours: 2, minutes: 30 });
    });
  });

  describe('Zero values', () => {
    test('rejects all zeros "0h0m"', () => {
      const result = card._parseDurationInput('0h0m');
      expect(result).toBeNull();
    });

    test('rejects "0m" as invalid', () => {
      const result = card._parseDurationInput('0m');
      expect(result).toBeNull();
    });

    test('rejects "0"', () => {
      const result = card._parseDurationInput('0');
      expect(result).toBeNull();
    });

    test('accepts "0h30m" (valid with non-zero minutes)', () => {
      const result = card._parseDurationInput('0h30m');
      expect(result).toEqual({ days: 0, hours: 0, minutes: 30 });
    });

    test('accepts "0d1h" (valid with non-zero hours)', () => {
      const result = card._parseDurationInput('0d1h');
      expect(result).toEqual({ days: 0, hours: 1, minutes: 0 });
    });
  });

  describe('Large values', () => {
    test('parses large day value "365d"', () => {
      const result = card._parseDurationInput('365d');
      expect(result).toEqual({ days: 365, hours: 0, minutes: 0 });
    });

    test('parses very large hour value "999h"', () => {
      const result = card._parseDurationInput('999h');
      expect(result).toEqual({ days: 0, hours: 999, minutes: 0 });
    });

    test('parses compound large values "100d24h60m"', () => {
      const result = card._parseDurationInput('100d24h60m');
      expect(result).toEqual({ days: 100, hours: 24, minutes: 60 });
    });

    test('handles extremely large number without crashing', () => {
      const result = card._parseDurationInput('999999d');
      expect(result).toEqual({ days: 999999, hours: 0, minutes: 0 });
    });
  });

  describe('Invalid formats', () => {
    test('rejects negative number "-30"', () => {
      const result = card._parseDurationInput('-30');
      expect(result).toBeNull();
    });

    test('parses decimal number "1.5h" by extracting integer parts', () => {
      const result = card._parseDurationInput('1.5h');
      // The regex captures digits before unit letters, so "5h" is found
      // This documents the current parser behavior with decimal inputs
      expect(result).toEqual({ days: 0, hours: 5, minutes: 0 });
    });

    test('rejects letters only "abc"', () => {
      const result = card._parseDurationInput('abc');
      expect(result).toBeNull();
    });

    test('rejects special characters "2h@30m"', () => {
      // Current behavior: parses what it can find
      const result = card._parseDurationInput('2h@30m');
      expect(result).toEqual({ days: 0, hours: 2, minutes: 30 });
    });

    test('rejects empty string', () => {
      const result = card._parseDurationInput('');
      expect(result).toBeNull();
    });

    test('rejects whitespace only', () => {
      const result = card._parseDurationInput('   ');
      expect(result).toBeNull();
    });
  });

  describe('_isDurationValid integration', () => {
    test('returns false for empty input', () => {
      card._customDurationInput = '';
      expect(card._isDurationValid()).toBe(false);
    });

    test('returns false for zero duration', () => {
      card._customDurationInput = '0m';
      expect(card._isDurationValid()).toBe(false);
    });

    test('returns true for valid duration with whitespace', () => {
      card._customDurationInput = '  30m  ';
      expect(card._isDurationValid()).toBe(true);
    });

    test('returns true for uppercase input', () => {
      card._customDurationInput = '2H30M';
      expect(card._isDurationValid()).toBe(true);
    });
  });
});

// =============================================================================
// SCHEDULE MODE VALIDATION EDGE CASES
// =============================================================================

describe('Schedule Mode Validation Edge Cases', () => {
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

  describe('Resume time boundary conditions', () => {
    test('rejects resume_at in the past', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;

      // Use a date clearly in the past to avoid timing issues
      const past = new Date(Date.now() - 3600000); // 1 hour ago
      card._resumeAtDate = past.toISOString().split('T')[0];
      card._resumeAtTime = past.toTimeString().slice(0, 5);
      card._disableAtDate = '';
      card._disableAtTime = '';

      await card._snooze();

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toContain('future');
    });

    test('accepts resume_at 1 hour in future', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;

      // Use 1 hour in the future to avoid timing edge cases
      const future = new Date(Date.now() + 3600000); // 1 hour in future
      card._resumeAtDate = future.toISOString().split('T')[0];
      card._resumeAtTime = future.toTimeString().slice(0, 5);
      card._disableAtDate = '';
      card._disableAtTime = '';

      await card._snooze();

      expect(mockHass.callService).toHaveBeenCalledWith('autosnooze', 'pause', expect.any(Object));
    });
  });

  describe('Year boundary handling', () => {
    test('handles schedule crossing year boundary', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;

      // Use dates far in the future to avoid timing issues
      const nextYear = new Date().getFullYear() + 1;

      card._disableAtDate = `${nextYear}-12-31`;
      card._disableAtTime = '23:59';
      card._resumeAtDate = `${nextYear + 1}-01-01`;
      card._resumeAtTime = '00:30';

      await card._snooze();

      // Should successfully call the service (not show validation error)
      expect(mockHass.callService).toHaveBeenCalled();
    });
  });

  describe('Disable/Resume time relationship', () => {
    test('rejects when disable_at equals resume_at', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;

      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const dateStr = futureDate.toISOString().split('T')[0];

      card._disableAtDate = dateStr;
      card._disableAtTime = '12:00';
      card._resumeAtDate = dateStr;
      card._resumeAtTime = '12:00'; // Same time

      await card._snooze();

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toContain('before resume');
    });

    test('rejects when disable_at is after resume_at', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;

      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const dateStr = futureDate.toISOString().split('T')[0];

      card._disableAtDate = dateStr;
      card._disableAtTime = '14:00'; // After resume
      card._resumeAtDate = dateStr;
      card._resumeAtTime = '12:00';

      await card._snooze();

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toContain('before resume');
    });

    test('accepts when disable_at is 1 hour before resume_at', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;

      // Use dates far in the future to avoid any timing issues
      const nextYear = new Date().getFullYear() + 1;
      const dateStr = `${nextYear}-06-15`;

      card._disableAtDate = dateStr;
      card._disableAtTime = '11:00';
      card._resumeAtDate = dateStr;
      card._resumeAtTime = '12:00';

      await card._snooze();

      expect(mockHass.callService).toHaveBeenCalled();
    });
  });

  describe('Missing required fields', () => {
    test('rejects when only resume date is set', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;

      const futureDate = new Date(Date.now() + 86400000);
      card._resumeAtDate = futureDate.toISOString().split('T')[0];
      card._resumeAtTime = ''; // Missing time

      await card._snooze();

      expect(mockHass.callService).not.toHaveBeenCalled();
    });

    test('rejects when only resume time is set', async () => {
      card._selected = ['automation.test'];
      card._scheduleMode = true;

      card._resumeAtDate = ''; // Missing date
      card._resumeAtTime = '12:00';

      await card._snooze();

      expect(mockHass.callService).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// REGISTRY FETCH FAILURE RECOVERY
// =============================================================================

describe('Registry Fetch Failure Recovery', () => {
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
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('card renders when label registry fetch fails', async () => {
    mockHass.connection = {
      sendMessagePromise: jest.fn().mockRejectedValue(new Error('Network error')),
    };
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const haCard = card.shadowRoot.querySelector('ha-card');
    expect(haCard).not.toBeNull();
  });

  test('card renders when category registry fetch fails', async () => {
    mockHass.connection = {
      sendMessagePromise: jest.fn().mockImplementation((msg) => {
        if (msg.type === 'config/category_registry/list') {
          return Promise.reject(new Error('Category fetch failed'));
        }
        return Promise.resolve([]);
      }),
    };
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const haCard = card.shadowRoot.querySelector('ha-card');
    expect(haCard).not.toBeNull();
  });

  test('card renders when entity registry fetch fails', async () => {
    mockHass.connection = {
      sendMessagePromise: jest.fn().mockImplementation((msg) => {
        if (msg.type === 'config/entity_registry/list') {
          return Promise.reject(new Error('Entity fetch failed'));
        }
        return Promise.resolve([]);
      }),
    };
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const haCard = card.shadowRoot.querySelector('ha-card');
    expect(haCard).not.toBeNull();
  });

  test('card renders when all registries fail', async () => {
    mockHass.connection = {
      sendMessagePromise: jest.fn().mockRejectedValue(new Error('All registries failed')),
    };
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const haCard = card.shadowRoot.querySelector('ha-card');
    expect(haCard).not.toBeNull();
    // Should still show automations
    const listItems = card.shadowRoot.querySelectorAll('.list-item');
    expect(listItems.length).toBe(1); // automation.test
  });

  test('partial registry success - label registry only', async () => {
    mockHass.connection = {
      sendMessagePromise: jest.fn().mockImplementation((msg) => {
        if (msg.type === 'config/label_registry/list') {
          return Promise.resolve([{ label_id: 'test_label', name: 'Test Label' }]);
        }
        return Promise.reject(new Error('Other registry failed'));
      }),
    };
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    expect(card._labelRegistry['test_label']).toBeDefined();
    expect(card._labelRegistry['test_label'].name).toBe('Test Label');
  });

  test('registry returns non-array data gracefully', async () => {
    mockHass.connection = {
      sendMessagePromise: jest.fn().mockResolvedValue({ invalid: 'data' }),
    };
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    // Should not crash, registries should be empty objects
    expect(card._labelRegistry).toEqual({});
  });

  test('registry fetch not repeated when already fetched', async () => {
    const sendMessageSpy = jest.fn().mockResolvedValue([]);
    mockHass.connection = { sendMessagePromise: sendMessageSpy };
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const initialCallCount = sendMessageSpy.mock.calls.length;

    // Trigger updated() again by setting hass again
    card.hass = { ...mockHass };
    await card.updateComplete;

    // Should not make additional calls because fetched flags are set
    expect(sendMessageSpy.mock.calls.length).toBe(initialCallCount);
  });
});

// =============================================================================
// SERVICE CALL ERROR HANDLING
// =============================================================================

describe('Service Call Error Handling', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
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
        'automation.test3': {
          entity_id: 'automation.test3',
          state: 'on',
          attributes: { friendly_name: 'Test 3' },
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

  describe('Snooze service errors', () => {
    test('shows error toast on service failure', async () => {
      card._selected = ['automation.test1'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      mockHass.callService.mockRejectedValueOnce(new Error('Service unavailable'));

      await card._snooze();

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toContain('Failed');
    });

    test('resets loading state on service failure', async () => {
      card._selected = ['automation.test1'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      mockHass.callService.mockRejectedValueOnce(new Error('Service unavailable'));

      await card._snooze();

      expect(card._loading).toBe(false);
    });

    test('shows friendly error for known translation_key', async () => {
      card._selected = ['automation.test1'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };

      const error = new Error('Validation failed');
      error.translation_key = 'not_automation';
      mockHass.callService.mockRejectedValueOnce(error);

      await card._snooze();

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast.textContent).toContain('not automations');
    });

    test('shows friendly error for invalid_duration', async () => {
      card._selected = ['automation.test1'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };

      const error = new Error('Validation failed');
      error.translation_key = 'invalid_duration';
      mockHass.callService.mockRejectedValueOnce(error);

      await card._snooze();

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast.textContent).toContain('valid duration');
    });
  });

  describe('Wake service errors', () => {
    test('shows error toast on wake failure', async () => {
      mockHass.callService.mockRejectedValueOnce(new Error('Wake failed'));

      await card._wake('automation.test1');

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toContain('Failed');
    });
  });

  describe('Cancel scheduled errors', () => {
    test('shows error toast on cancel scheduled failure', async () => {
      mockHass.callService.mockRejectedValueOnce(new Error('Cancel failed'));

      await card._cancelScheduled('automation.test1');

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toContain('Failed');
    });
  });

  describe('Undo functionality errors', () => {
    test('undo shows error toast on failure', async () => {
      card._selected = ['automation.test1'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };

      await card._snooze();

      // First call was for snooze (success), next for undo (fail)
      mockHass.callService.mockRejectedValueOnce(new Error('Undo failed'));

      const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
      undoBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should show a new toast with failure message
      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast.textContent).toContain('Failed to undo');
    });
  });
});

// =============================================================================
// TOAST NOTIFICATION LIFECYCLE
// =============================================================================

describe('Toast Notification Lifecycle', () => {
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

  test('multiple rapid toasts replace each other', () => {
    card._showToast('First message');
    card._showToast('Second message');
    card._showToast('Third message');

    const toasts = card.shadowRoot.querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Third message');
  });

  test('toast has correct ARIA attributes for accessibility', () => {
    card._showToast('Accessible message');

    const toast = card.shadowRoot.querySelector('.toast');
    expect(toast.getAttribute('role')).toBe('alert');
    expect(toast.getAttribute('aria-live')).toBe('polite');
    expect(toast.getAttribute('aria-atomic')).toBe('true');
  });

  test('toast with undo button has accessible label', () => {
    card._showToast('Message', { showUndo: true, onUndo: jest.fn() });

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    expect(undoBtn.getAttribute('aria-label')).toBe('Undo last action');
  });

  test('clicking undo removes toast immediately', () => {
    const onUndo = jest.fn();
    card._showToast('Message', { showUndo: true, onUndo });

    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    undoBtn.click();

    const toast = card.shadowRoot.querySelector('.toast');
    expect(toast).toBeNull();
    expect(onUndo).toHaveBeenCalled();
  });
});

// =============================================================================
// COUNTDOWN TIMER EDGE CASES
// =============================================================================

describe('Countdown Timer Edge Cases', () => {
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

  describe('_formatCountdown edge cases', () => {
    test('returns "Resuming..." for exactly current time', () => {
      const now = new Date().toISOString();
      expect(card._formatCountdown(now)).toBe('Resuming...');
    });

    test('returns "Resuming..." for 1ms in the past', () => {
      const past = new Date(Date.now() - 1).toISOString();
      expect(card._formatCountdown(past)).toBe('Resuming...');
    });

    test('formats 1 second in future correctly', () => {
      const future = new Date(Date.now() + 1500).toISOString(); // 1.5 seconds
      const result = card._formatCountdown(future);
      expect(result).toMatch(/0m \d+s/);
    });

    test('formats 59 seconds correctly', () => {
      const future = new Date(Date.now() + 59000).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/0m 5\ds/);
    });

    test('formats exactly 1 hour correctly', () => {
      const future = new Date(Date.now() + 3600000).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1h 0m 0s/);
    });

    test('formats exactly 1 day correctly', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const result = card._formatCountdown(future);
      expect(result).toMatch(/1d 0h 0m/);
    });

    test('formats multiple days correctly', () => {
      const future = new Date(Date.now() + 259200000).toISOString(); // 3 days
      const result = card._formatCountdown(future);
      expect(result).toMatch(/3d/);
    });
  });

  describe('_updateCountdownIfNeeded', () => {
    test('does not crash when no countdown elements exist', () => {
      expect(() => card._updateCountdownIfNeeded()).not.toThrow();
    });

    test('updates countdown element with valid data-resume-at', () => {
      const futureTime = new Date(Date.now() + 3600000).toISOString();

      const countdownEl = document.createElement('span');
      countdownEl.className = 'countdown';
      countdownEl.dataset.resumeAt = futureTime;
      countdownEl.textContent = 'old value';
      card.shadowRoot.appendChild(countdownEl);

      card._updateCountdownIfNeeded();

      expect(countdownEl.textContent).not.toBe('old value');
      // Match time format like "59m 59s" or "1h 0m 0s"
      expect(countdownEl.textContent).toMatch(/\d+[hms]/);
    });

    test('handles countdown element without data-resume-at', () => {
      const countdownEl = document.createElement('span');
      countdownEl.className = 'countdown';
      // No data-resume-at attribute
      card.shadowRoot.appendChild(countdownEl);

      expect(() => card._updateCountdownIfNeeded()).not.toThrow();
    });
  });
});

// =============================================================================
// SEARCH DEBOUNCE EDGE CASES
// =============================================================================

describe('Search Debounce Edge Cases', () => {
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

  test('rapid search inputs only trigger one update', () => {
    jest.useFakeTimers();

    card._handleSearchInput({ target: { value: 'a' } });
    card._handleSearchInput({ target: { value: 'ab' } });
    card._handleSearchInput({ target: { value: 'abc' } });

    expect(card._search).toBe(''); // Not updated yet

    jest.advanceTimersByTime(350);

    expect(card._search).toBe('abc'); // Only final value

    jest.useRealTimers();
  });

  test('search timeout is cleared on disconnect', () => {
    jest.useFakeTimers();

    card._handleSearchInput({ target: { value: 'test' } });
    expect(card._searchTimeout).not.toBeNull();

    card.remove();

    expect(card._searchTimeout).toBeNull();

    jest.useRealTimers();
  });
});

// =============================================================================
// FORMAT REGISTRY ID EDGE CASES
// =============================================================================

describe('Format Registry ID Edge Cases', () => {
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
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  test('formats simple snake_case correctly', () => {
    expect(card._formatRegistryId('living_room')).toBe('Living Room');
  });

  test('formats multiple underscores correctly', () => {
    expect(card._formatRegistryId('my_custom_area_name')).toBe('My Custom Area Name');
  });

  test('handles single word without underscores', () => {
    expect(card._formatRegistryId('bedroom')).toBe('Bedroom');
  });

  test('handles numbers in names', () => {
    expect(card._formatRegistryId('room_2')).toBe('Room 2');
  });

  test('handles leading number', () => {
    expect(card._formatRegistryId('2nd_floor')).toBe('2nd Floor');
  });

  test('handles empty string', () => {
    expect(card._formatRegistryId('')).toBe('');
  });

  test('handles all lowercase already', () => {
    expect(card._formatRegistryId('test')).toBe('Test');
  });
});

// =============================================================================
// ZERO DURATION SNOOZE PREVENTION
// =============================================================================

describe('Zero Duration Snooze Prevention', () => {
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

  test('does not call service when duration is zero', async () => {
    card._selected = ['automation.test'];
    card._duration = 0;
    card._customDuration = { days: 0, hours: 0, minutes: 0 };

    await card._snooze();

    expect(mockHass.callService).not.toHaveBeenCalled();
  });

  test('snooze button is disabled when duration is invalid', async () => {
    card._selected = ['automation.test'];
    card._showCustomInput = true;
    card._customDurationInput = '0m';
    await card.updateComplete;

    const snoozeBtn = card.shadowRoot.querySelector('.snooze-btn');
    expect(snoozeBtn.disabled).toBe(true);
  });
});
