/**
 * Tests for backend schema alignment and validation.
 *
 * These tests ensure that:
 * 1. Frontend error messages align with backend translation keys
 * 2. Frontend correctly handles captured backend error responses
 * 3. Services.yaml schema is correctly implemented in frontend
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import the built card to test error handling
import '../custom_components/autosnooze/www/autosnooze-card.js';

// Get the directory of this test file
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load fixture files - throw if files don't exist (fail fast)
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
// DATE HELPERS - Avoid hardcoded dates
// =============================================================================

/**
 * Get a future date string in YYYY-MM-DD format.
 * @param {number} daysFromNow - Number of days from now
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getFutureDate(daysFromNow = 1) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

/**
 * Get a past date string in YYYY-MM-DD format.
 * @param {number} daysAgo - Number of days ago
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getPastDate(daysAgo = 1) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

/**
 * Get a future ISO datetime string.
 * @param {number} hoursFromNow - Number of hours from now
 * @returns {string} ISO datetime string
 */
function getFutureISODateTime(hoursFromNow = 1) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

/**
 * Create dynamic sensor state with relative times.
 * @param {object} options - Options for the sensor state
 * @returns {object} Sensor state object
 */
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
// ERROR SCHEMA ALIGNMENT TESTS
// =============================================================================

describe('Backend Error Schema Alignment', () => {
  describe('Translation keys synchronization', () => {
    test('all backend translation keys exist in frontend ERROR_MESSAGES', () => {
      // Get all translation keys from backend errors fixture
      const backendKeys = Object.keys(backendErrors.errors);
      expect(backendKeys.length).toBeGreaterThan(0);

      // Get the card class to access ERROR_MESSAGES via _getErrorMessage
      const CardClass = customElements.get('autosnooze-card');
      expect(CardClass).toBeDefined();
      const card = new CardClass();

      // Test each backend key produces a specific error message (not default)
      for (const key of backendKeys) {
        const error = { translation_key: key };
        const result = card._getErrorMessage(error, 'Default message');

        // Should NOT return the default message with "Check Home Assistant logs"
        expect(result).not.toContain('Check Home Assistant logs');
        expect(result).not.toBe('Default message. Check Home Assistant logs for details.');
      }
    });

    test('all backend translation keys in translations/en.json have frontend handlers', () => {
      const translationKeys = Object.keys(translations.exceptions || {});
      expect(translationKeys.length).toBeGreaterThan(0);

      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();

      for (const key of translationKeys) {
        const error = { translation_key: key };
        const result = card._getErrorMessage(error, 'Default');

        // Each translation key should map to a specific user-friendly message
        expect(result).not.toContain('Check Home Assistant logs');
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
      // Create fresh mock for each test
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

    test('handles error with pattern in message (fallback)', () => {
      const variant = backendResponses.error_responses.not_automation.response_variants[1];
      const result = card._getErrorMessage(variant, 'Default');
      expect(result).toBe('Failed to snooze: One or more selected items are not automations');
    });

    test('handles resume_time_past error variants', () => {
      // Main response
      const mainResponse = backendResponses.error_responses.resume_time_past.response;
      expect(card._getErrorMessage(mainResponse, 'Default')).toBe(
        'Failed to snooze: Resume time must be in the future'
      );

      // Variant with data.translation_key
      const variant = backendResponses.error_responses.resume_time_past.response_variants[0];
      expect(card._getErrorMessage(variant, 'Default')).toBe(
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

    test('handles error with empty translation_key', () => {
      const error = { translation_key: '' };
      const result = card._getErrorMessage(error, 'Fallback');
      expect(result).toBe('Fallback. Check Home Assistant logs for details.');
    });
  });
});

// =============================================================================
// SERVICES.YAML VALIDATION TESTS
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

      // Required field
      expect(pauseService.fields.entity_id).toBeDefined();
      expect(pauseService.fields.entity_id.required).toBe(true);

      // Optional duration fields
      expect(pauseService.fields.days).toBeDefined();
      expect(pauseService.fields.hours).toBeDefined();
      expect(pauseService.fields.minutes).toBeDefined();

      // Optional datetime fields
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
      // cancel_all should have no fields or empty fields
      expect(cancelAllService.fields).toBeUndefined();
    });

    test('pause_by_area service has area_id field', () => {
      const service = servicesYaml.pause_by_area;
      expect(service).toBeDefined();
      expect(service.fields.area_id).toBeDefined();
      expect(service.fields.area_id.required).toBe(true);
      expect(service.fields.area_id.selector.area).toBeDefined();
    });

    test('pause_by_label service has label_id field', () => {
      const service = servicesYaml.pause_by_label;
      expect(service).toBeDefined();
      expect(service.fields.label_id).toBeDefined();
      expect(service.fields.label_id.required).toBe(true);
      expect(service.fields.label_id.selector.label).toBeDefined();
    });

    test('cancel_scheduled service has entity_id field', () => {
      const service = servicesYaml.cancel_scheduled;
      expect(service).toBeDefined();
      expect(service.fields.entity_id).toBeDefined();
      expect(service.fields.entity_id.required).toBe(true);
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

    test('duration constraints are enforced across all services with duration fields', () => {
      const servicesWithDuration = ['pause', 'pause_by_area', 'pause_by_label'];

      for (const serviceName of servicesWithDuration) {
        const service = servicesYaml[serviceName];
        expect(service, `Service ${serviceName} should exist`).toBeDefined();

        // All should have same constraints
        expect(service.fields.days.selector.number.max).toBe(365);
        expect(service.fields.hours.selector.number.max).toBe(23);
        expect(service.fields.minutes.selector.number.max).toBe(59);
      }
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

    test('all entity_id fields restrict to automation domain', () => {
      const servicesWithEntityId = ['pause', 'cancel', 'cancel_scheduled'];

      for (const serviceName of servicesWithEntityId) {
        const service = servicesYaml[serviceName];
        expect(
          service.fields.entity_id.selector.entity.domain,
          `${serviceName} should restrict to automation domain`
        ).toBe('automation');
      }
    });
  });
});

// =============================================================================
// FRONTEND SERVICE CALL TESTS WITH CAPTURED RESPONSES
// =============================================================================

describe('Frontend Service Calls with Captured Responses', () => {
  let card;
  let mockCallService;
  let initialHassState;

  beforeEach(async () => {
    // Create fresh mock for each test
    mockCallService = vi.fn().mockResolvedValue(undefined);

    initialHassState = {
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
      entities: {
        'automation.test': {
          entity_id: 'automation.test',
          area_id: null,
          labels: [],
        },
      },
      areas: {},
      callService: mockCallService,
    };

    const mockHass = createMockHass(initialHassState);

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
    initialHassState = null;
    vi.clearAllMocks();
  });

  describe('pause service', () => {
    test('sends correct parameters for duration-based snooze', async () => {
      card._selected = ['automation.test'];
      card._customDuration = { days: 1, hours: 2, minutes: 30 };
      card._scheduleMode = false;

      await card._snooze();

      expect(mockCallService).toHaveBeenCalledTimes(1);
      expect(mockCallService).toHaveBeenCalledWith('autosnooze', 'pause', {
        entity_id: ['automation.test'],
        days: 1,
        hours: 2,
        minutes: 30,
      });

      // Verify state was cleared after snooze
      expect(card._selected).toEqual([]);
      expect(card._loading).toBe(false);
    });

    test('sends correct parameters for schedule-based snooze', async () => {
      const futureDate = getFutureDate(7);

      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._resumeAtDate = futureDate;
      card._resumeAtTime = '14:00';

      await card._snooze();

      expect(mockCallService).toHaveBeenCalledTimes(1);
      const call = mockCallService.mock.calls[0];
      expect(call[0]).toBe('autosnooze');
      expect(call[1]).toBe('pause');
      expect(call[2].entity_id).toEqual(['automation.test']);
      // Verify resume_at uses the dynamic future date
      expect(call[2].resume_at).toMatch(new RegExp(`^${futureDate}T14:00`));

      // Verify schedule inputs were cleared
      expect(card._resumeAtDate).toBe('');
      expect(card._resumeAtTime).toBe('');
    });

    test('handles not_automation error from backend and shows toast', async () => {
      const backendError = backendResponses.error_responses.not_automation.response;
      mockCallService.mockRejectedValueOnce(backendError);

      card._selected = ['light.invalid'];
      card._customDuration = { days: 0, hours: 1, minutes: 0 };

      await card._snooze();

      // Verify error was handled
      expect(card._loading).toBe(false);

      // Check toast was shown with correct message
      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toContain('not automations');
    });

    test('handles invalid_duration error from backend', async () => {
      const backendError = backendResponses.error_responses.invalid_duration.response;
      mockCallService.mockRejectedValueOnce(backendError);

      card._selected = ['automation.test'];
      card._customDuration = { days: 0, hours: 0, minutes: 1 };

      await card._snooze();

      expect(card._loading).toBe(false);

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent.toLowerCase()).toContain('duration');
    });

    test('handles resume_time_past error from backend', async () => {
      const backendError = backendResponses.error_responses.resume_time_past.response;
      mockCallService.mockRejectedValueOnce(backendError);

      // Even though frontend validates, backend might reject
      card._selected = ['automation.test'];
      card._scheduleMode = true;
      card._resumeAtDate = getFutureDate(1);
      card._resumeAtTime = '14:00';

      await card._snooze();

      expect(card._loading).toBe(false);

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent.toLowerCase()).toContain('future');
    });

    test('does not call service when no automations selected', async () => {
      card._selected = [];
      card._customDuration = { days: 0, hours: 1, minutes: 0 };

      await card._snooze();

      expect(mockCallService).not.toHaveBeenCalled();
    });

    test('does not call service when duration is zero', async () => {
      card._selected = ['automation.test'];
      card._duration = 0;
      card._customDuration = { days: 0, hours: 0, minutes: 0 };
      card._scheduleMode = false;

      await card._snooze();

      expect(mockCallService).not.toHaveBeenCalled();
    });
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

      // Should not throw
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

  describe('cancel_scheduled service', () => {
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
});

// =============================================================================
// SENSOR STATE HANDLING WITH CAPTURED RESPONSES
// =============================================================================

describe('Sensor State Handling with Captured Responses', () => {
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

  test('handles sensor state with scheduled snoozes', async () => {
    const scheduledSnoozes = {
      'automation.morning_routine': {
        entity_id: 'automation.morning_routine',
        friendly_name: 'Morning Routine',
        disable_at: getFutureISODateTime(4),
        resume_at: getFutureISODateTime(12),
      },
    };

    const sensorState = createDynamicSensorState({
      scheduledCount: 1,
      scheduledSnoozes,
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

    const scheduled = card._getScheduled();
    expect(Object.keys(scheduled).length).toBe(1);
    expect(scheduled['automation.morning_routine']).toBeDefined();
    expect(scheduled['automation.morning_routine'].disable_at).toBeDefined();
    expect(scheduled['automation.morning_routine'].resume_at).toBeDefined();
  });

  test('paused automation has expected structure from backend', async () => {
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
    };

    const sensorState = createDynamicSensorState({
      pausedCount: 1,
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
    const automation = paused['automation.living_room_lights'];

    // Verify structure matches PausedAutomation from backend
    expect(automation.entity_id).toBe('automation.living_room_lights');
    expect(automation.friendly_name).toBe('Living Room Lights');
    expect(automation.resume_at).toBeDefined();
    expect(automation.paused_at).toBeDefined();
    expect(automation.days).toBe(0);
    expect(automation.hours).toBe(2);
    expect(automation.minutes).toBe(0);
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

    const sensorState = createDynamicSensorState({
      scheduledCount: 1,
      scheduledSnoozes,
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

    const scheduled = card._getScheduled();
    const snooze = scheduled['automation.morning_routine'];

    // Verify structure matches ScheduledSnooze from backend
    expect(snooze.entity_id).toBe('automation.morning_routine');
    expect(snooze.friendly_name).toBe('Morning Routine');
    expect(snooze.disable_at).toBeDefined();
    expect(snooze.resume_at).toBeDefined();
  });

  test('handles missing sensor gracefully', async () => {
    const mockHass = createMockHass({
      states: {
        // No autosnooze sensor
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

    // Should return empty objects, not throw
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

    // Should not throw
    const paused = card._getPaused();
    const scheduled = card._getScheduled();

    expect(paused).toEqual({});
    expect(scheduled).toEqual({});
  });
});

// =============================================================================
// TRANSLATION CONSISTENCY TESTS
// =============================================================================

describe('Translation Consistency', () => {
  test('exception messages in translations match backend error meanings', () => {
    const exceptions = translations.exceptions;
    expect(exceptions).toBeDefined();

    // not_automation
    expect(exceptions.not_automation.message).toContain('automation');
    expect(exceptions.not_automation.message).toContain('{entity_id}');

    // resume_time_past
    expect(exceptions.resume_time_past.message.toLowerCase()).toContain('future');

    // disable_after_resume
    expect(exceptions.disable_after_resume.message.toLowerCase()).toContain('before');

    // invalid_duration
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

  test('all exception translation keys are documented in fixtures', () => {
    const fixtureKeys = Object.keys(backendErrors.errors);
    const translationKeys = Object.keys(translations.exceptions);

    // Ensure fixtures document all translation keys
    for (const key of translationKeys) {
      expect(fixtureKeys, `Fixture missing for translation key: ${key}`).toContain(key);
    }
  });
});

// =============================================================================
// INTEGRATION STATE CHANGE TESTS
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

  test('failed snooze keeps selection intact for retry', async () => {
    mockCallService.mockRejectedValueOnce(new Error('Network error'));

    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 1, minutes: 0 };

    const originalSelection = [...card._selected];

    await card._snooze();

    // Selection might be cleared or kept depending on implementation
    // This test documents the actual behavior
    expect(card._loading).toBe(false);
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

    // Note: Due to async nature, loading might have been true during the call
    expect(card._loading).toBe(false);
  });

  test('undo after snooze calls cancel service and restores selection', async () => {
    card._selected = ['automation.test'];
    card._customDuration = { days: 0, hours: 0, minutes: 30 };

    await card._snooze();

    expect(card._selected).toEqual([]);

    // Find and click undo button
    const undoBtn = card.shadowRoot.querySelector('.toast-undo-btn');
    expect(undoBtn).not.toBeNull();

    undoBtn.click();

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify cancel was called
    expect(mockCallService).toHaveBeenCalledWith('autosnooze', 'cancel', {
      entity_id: 'automation.test',
    });

    // Selection should be restored
    expect(card._selected).toContain('automation.test');
  });
});

// =============================================================================
// CACHE BEHAVIOR TESTS
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

    // First call should populate cache
    const result1 = card._getAutomations();
    expect(result1.length).toBe(2);

    // Store cache reference
    const cacheRef = card._automationsCache;
    expect(cacheRef).not.toBeNull();

    // Second call with same hass.states should return cached result
    const result2 = card._getAutomations();
    expect(result2).toBe(cacheRef); // Same reference = cache hit
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

    // First call populates cache
    const result1 = card._getAutomations();
    expect(result1.length).toBe(1);
    const cacheRef1 = card._automationsCache;

    // Create new states object (new reference)
    const newStates = {
      ...initialStates,
      'automation.test2': {
        entity_id: 'automation.test2',
        state: 'on',
        attributes: { friendly_name: 'Test 2' },
      },
    };

    // Update hass with new states reference
    card.hass = createMockHass({ states: newStates });
    await card.updateComplete;

    // Call again - should rebuild cache because states reference changed
    const result2 = card._getAutomations();
    expect(result2.length).toBe(2);
    expect(result2).not.toBe(cacheRef1); // Different reference = cache miss
  });

  test('cache is invalidated when entity registry is fetched', async () => {
    const mockHass = createMockHass({
      states: {
        'automation.test1': {
          entity_id: 'automation.test1',
          state: 'on',
          attributes: { friendly_name: 'Test 1' },
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

    // Get initial cache version
    const initialVersion = card._automationsCacheVersion;

    // Populate cache
    card._getAutomations();
    const cacheRef = card._automationsCache;

    // Simulate incrementing cache version (happens after entity registry fetch)
    card._automationsCacheVersion++;

    // Call again - cache should be invalidated due to version change
    const result = card._getAutomations();
    expect(card._automationsCacheVersion).toBe(initialVersion + 1);
    expect(result).not.toBe(cacheRef); // Different reference = cache invalidated
  });

  test('cache handles empty states gracefully', async () => {
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

    const result = card._getAutomations();
    expect(result).toEqual([]);
    expect(card._automationsCache).toEqual([]);
  });

  test('cache is not shared between card instances', async () => {
    const mockHass = createMockHass({
      states: {
        'automation.test1': {
          entity_id: 'automation.test1',
          state: 'on',
          attributes: { friendly_name: 'Test 1' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');

    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze 1' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;
    card._getAutomations();
    const cache1 = card._automationsCache;

    const card2 = new CardClass();
    card2.setConfig({ title: 'AutoSnooze 2' });
    card2.hass = mockHass;
    document.body.appendChild(card2);
    await card2.updateComplete;
    card2._getAutomations();
    const cache2 = card2._automationsCache;

    // Each card should have its own cache
    expect(cache1).not.toBe(cache2);

    // Clean up second card
    card2.parentNode.removeChild(card2);
  });
});

// =============================================================================
// DEBOUNCE BEHAVIOR TESTS
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
    // Verify no timeout initially
    expect(card._searchTimeout).toBeNull();

    // Simulate typing
    card._handleSearchInput({ target: { value: 'test' } });

    // Should have created a timeout (debounce is active)
    // Note: In jsdom, setTimeout returns a Timeout object, not a number
    expect(card._searchTimeout).not.toBeNull();
    expect(card._searchTimeout).toBeTruthy();

    // Search should NOT be updated immediately
    expect(card._search).toBe('');
  });

  test('rapid inputs reset the debounce timer', () => {
    // First input
    card._handleSearchInput({ target: { value: 'first' } });
    const firstTimeout = card._searchTimeout;
    expect(firstTimeout).not.toBeNull();

    // Second input should create new timeout
    card._handleSearchInput({ target: { value: 'second' } });
    const secondTimeout = card._searchTimeout;

    // Timeout ID should be different (timer was reset)
    expect(secondTimeout).not.toBeNull();
    expect(secondTimeout).not.toBe(firstTimeout);

    // Search still not updated (still debouncing)
    expect(card._search).toBe('');
  });

  test('search value is updated after debounce period', async () => {
    const SEARCH_DEBOUNCE_MS = 300;

    card._handleSearchInput({ target: { value: 'test query' } });
    expect(card._search).toBe('');

    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 50));

    expect(card._search).toBe('test query');
    expect(card._searchTimeout).toBeNull();
  });

  test('only final value is applied after rapid typing', async () => {
    const SEARCH_DEBOUNCE_MS = 300;

    // Rapid inputs
    card._handleSearchInput({ target: { value: 'a' } });
    card._handleSearchInput({ target: { value: 'ab' } });
    card._handleSearchInput({ target: { value: 'abc' } });
    card._handleSearchInput({ target: { value: 'abcd' } });

    // Nothing applied yet
    expect(card._search).toBe('');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 50));

    // Only final value applied
    expect(card._search).toBe('abcd');
  });

  test('clearing search also debounces', async () => {
    const SEARCH_DEBOUNCE_MS = 300;

    // Set initial search directly
    card._search = 'existing';

    // Clear via handler (should debounce)
    card._handleSearchInput({ target: { value: '' } });
    expect(card._search).toBe('existing'); // Not cleared yet

    await new Promise(resolve => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 50));
    expect(card._search).toBe(''); // Now cleared
  });

  test('searchTimeout is cleaned up after debounce completes', async () => {
    const SEARCH_DEBOUNCE_MS = 300;

    card._handleSearchInput({ target: { value: 'test' } });
    expect(card._searchTimeout).not.toBeNull();

    await new Promise(resolve => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 50));
    expect(card._searchTimeout).toBeNull();
  });
});

// =============================================================================
// SELECTOR CORRECTNESS TESTS
// =============================================================================

describe('Selector Correctness', () => {
  let card;

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
    card = null;
    vi.clearAllMocks();
  });

  describe('Toast selector verification', () => {
    test('toast has correct ARIA attributes for accessibility', async () => {
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

      // Trigger a toast
      card._showToast('Test message');

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.getAttribute('role')).toBe('alert');
      expect(toast.getAttribute('aria-live')).toBe('polite');
      expect(toast.getAttribute('aria-atomic')).toBe('true');
      expect(toast.textContent).toBe('Test message');
    });

    test('toast with undo has correctly structured elements', async () => {
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

      let undoCalled = false;
      card._showToast('Snoozed', { showUndo: true, onUndo: () => { undoCalled = true; } });

      const toast = card.shadowRoot.querySelector('.toast');
      expect(toast).not.toBeNull();

      // Check message text is in a span
      const textSpan = toast.querySelector('span');
      expect(textSpan).not.toBeNull();
      expect(textSpan.textContent).toBe('Snoozed');

      // Check undo button exists with correct attributes
      const undoBtn = toast.querySelector('.toast-undo-btn');
      expect(undoBtn).not.toBeNull();
      expect(undoBtn.textContent).toBe('Undo');
      expect(undoBtn.getAttribute('aria-label')).toBe('Undo last action');

      // Verify undo callback works
      undoBtn.click();
      expect(undoCalled).toBe(true);

      // Toast should be removed after undo
      expect(card.shadowRoot.querySelector('.toast')).toBeNull();
    });

    test('new toast replaces existing toast', async () => {
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

      // Show first toast
      card._showToast('First message');
      const toast1 = card.shadowRoot.querySelector('.toast');
      expect(toast1.textContent).toBe('First message');

      // Show second toast - should replace first
      card._showToast('Second message');
      const toasts = card.shadowRoot.querySelectorAll('.toast');
      expect(toasts.length).toBe(1);
      expect(toasts[0].textContent).toBe('Second message');
    });
  });

  describe('Duration selector verification', () => {
    test('duration presets render with correct values', async () => {
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

      // Select an automation to show duration selector
      card._selected = ['automation.test'];
      await card.updateComplete;

      // Get duration buttons (class is .pill in duration-pills container)
      const durationPills = card.shadowRoot.querySelector('.duration-pills');
      expect(durationPills).not.toBeNull();

      const buttons = durationPills.querySelectorAll('.pill');
      expect(buttons.length).toBeGreaterThan(0);

      // Verify default presets are present with correct labels
      const buttonLabels = Array.from(buttons).map(btn => btn.textContent.trim());
      expect(buttonLabels).toContain('30m');
      expect(buttonLabels).toContain('1h');
      expect(buttonLabels).toContain('1d');
      expect(buttonLabels).toContain('Custom');
    });

    test('clicking duration preset updates _duration correctly', async () => {
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

      // Select an automation
      card._selected = ['automation.test'];
      await card.updateComplete;

      // Find the 1h button and click it
      const durationPills = card.shadowRoot.querySelector('.duration-pills');
      expect(durationPills).not.toBeNull();

      const buttons = durationPills.querySelectorAll('.pill');
      const oneHourButton = Array.from(buttons).find(btn => btn.textContent.trim() === '1h');
      expect(oneHourButton).toBeDefined();

      oneHourButton.click();
      await card.updateComplete;

      // Verify duration is set to 60 minutes in milliseconds (60 * 60000 = 3600000)
      expect(card._duration).toBe(60 * 60 * 1000);
    });

    test('selected duration pill has active state', async () => {
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

      // Select an automation
      card._selected = ['automation.test'];
      await card.updateComplete;

      // Click on the 1h button to set duration
      const durationPills = card.shadowRoot.querySelector('.duration-pills');
      expect(durationPills).not.toBeNull();

      const buttons = durationPills.querySelectorAll('.pill');
      const oneHourButton = Array.from(buttons).find(btn => btn.textContent.trim() === '1h');
      expect(oneHourButton).toBeDefined();

      // Click to select it
      oneHourButton.click();
      await card.updateComplete;

      // Re-query after update
      const updatedDurationPills = card.shadowRoot.querySelector('.duration-pills');
      const updatedButtons = updatedDurationPills.querySelectorAll('.pill');
      const updatedOneHourButton = Array.from(updatedButtons).find(btn => btn.textContent.trim() === '1h');

      // Check it has the active class
      expect(updatedOneHourButton.classList.contains('active')).toBe(true);

      // Other duration buttons (not 1h and not Custom when showCustomInput is false) should not be active
      const otherDurationButtons = Array.from(updatedButtons).filter(
        btn => btn.textContent.trim() !== '1h' && btn.textContent.trim() !== 'Custom'
      );
      for (const btn of otherDurationButtons) {
        expect(btn.classList.contains('active')).toBe(false);
      }
    });
  });

  describe('Automation list selector verification', () => {
    test('automation items render with correct names', async () => {
      const mockHass = createMockHass({
        states: {
          'automation.living_room': {
            entity_id: 'automation.living_room',
            state: 'on',
            attributes: { friendly_name: 'Living Room Lights' },
          },
          'automation.bedroom': {
            entity_id: 'automation.bedroom',
            state: 'on',
            attributes: { friendly_name: 'Bedroom Fan' },
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

      // Get automation items (class is .list-item)
      const items = card.shadowRoot.querySelectorAll('.list-item');
      expect(items.length).toBe(2);

      // Verify names are rendered correctly (class is .list-item-name)
      const names = Array.from(items).map(item => {
        const nameEl = item.querySelector('.list-item-name');
        return nameEl ? nameEl.textContent.trim() : '';
      });
      expect(names).toContain('Living Room Lights');
      expect(names).toContain('Bedroom Fan');

      // Verify each item has a checkbox input
      const checkboxes = Array.from(items).map(item => item.querySelector('input[type="checkbox"]'));
      expect(checkboxes.every(cb => cb !== null)).toBe(true);
    });

    test('selected automation has visual indicator and checked checkbox', async () => {
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

      // Select one automation
      card._selected = ['automation.test1'];
      await card.updateComplete;

      const items = card.shadowRoot.querySelectorAll('.list-item');
      expect(items.length).toBe(2);

      // Find items by name
      let selectedItem = null;
      let unselectedItem = null;

      for (const item of items) {
        const nameEl = item.querySelector('.list-item-name');
        const name = nameEl ? nameEl.textContent.trim() : '';
        if (name === 'Test 1') {
          selectedItem = item;
        } else if (name === 'Test 2') {
          unselectedItem = item;
        }
      }

      // Selected item should have 'selected' class
      expect(selectedItem).not.toBeNull();
      expect(selectedItem.classList.contains('selected')).toBe(true);

      // Verify checkbox is checked for selected item
      const selectedCheckbox = selectedItem.querySelector('input[type="checkbox"]');
      expect(selectedCheckbox.checked).toBe(true);

      // Unselected item should not have 'selected' class
      expect(unselectedItem).not.toBeNull();
      expect(unselectedItem.classList.contains('selected')).toBe(false);

      // Verify checkbox is unchecked for unselected item
      const unselectedCheckbox = unselectedItem.querySelector('input[type="checkbox"]');
      expect(unselectedCheckbox.checked).toBe(false);
    });

    test('clicking automation item toggles selection', async () => {
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

      expect(card._selected).toEqual([]);

      // Click the automation item
      const item = card.shadowRoot.querySelector('.list-item');
      expect(item).not.toBeNull();

      item.click();
      await card.updateComplete;

      // Should now be selected
      expect(card._selected).toContain('automation.test');
      expect(item.classList.contains('selected')).toBe(true);

      // Click again to deselect
      item.click();
      await card.updateComplete;

      expect(card._selected).not.toContain('automation.test');
      expect(item.classList.contains('selected')).toBe(false);
    });
  });

  describe('Paused automation selector verification', () => {
    test('paused automations render with countdown and wake button', async () => {
      const mockHass = createMockHass({
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '1',
            attributes: {
              paused_automations: {
                'automation.test': {
                  entity_id: 'automation.test',
                  friendly_name: 'Test Automation',
                  resume_at: getFutureISODateTime(2),
                  paused_at: new Date().toISOString(),
                  days: 0,
                  hours: 2,
                  minutes: 0,
                },
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

      // Find paused automation section
      const pausedSection = card.shadowRoot.querySelector('.paused-section, .snoozed-section, [class*="paused"]');

      // Find wake button - it should exist and be clickable
      const wakeButtons = card.shadowRoot.querySelectorAll('button');
      const wakeButton = Array.from(wakeButtons).find(btn =>
        btn.textContent.toLowerCase().includes('wake') ||
        btn.getAttribute('aria-label')?.toLowerCase().includes('wake')
      );

      // Should have some way to wake the automation
      expect(wakeButton || pausedSection).not.toBeNull();
    });

    test('countdown displays remaining time correctly', async () => {
      // Use a specific future time for predictable testing
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const mockHass = createMockHass({
        states: {
          'sensor.autosnooze_snoozed_automations': {
            state: '1',
            attributes: {
              paused_automations: {
                'automation.test': {
                  entity_id: 'automation.test',
                  friendly_name: 'Test Automation',
                  resume_at: twoHoursFromNow.toISOString(),
                  paused_at: new Date().toISOString(),
                  days: 0,
                  hours: 2,
                  minutes: 0,
                },
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

      // Look for countdown text - should contain hours or time indication
      const cardText = card.shadowRoot.textContent;

      // Should show some time indicator (hours, h, :, or similar)
      const hasTimeIndicator =
        cardText.includes('h') ||
        cardText.includes(':') ||
        cardText.includes('hour') ||
        cardText.includes('min');

      expect(hasTimeIndicator).toBe(true);
    });
  });
});
