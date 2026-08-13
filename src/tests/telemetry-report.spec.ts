import { describe, expect, test, vi } from 'vitest';

import { reportTelemetry } from '../services/telemetry.js';
import type { HomeAssistant } from '../types/hass.js';

function hassWithTelemetryService(
  callService: HomeAssistant['callService'] = vi.fn()
): HomeAssistant {
  return {
    callService,
    services: { autosnooze: { report_telemetry: {} } },
  } as unknown as HomeAssistant;
}

describe('reportTelemetry', () => {
  test('calls autosnooze.report_telemetry for valid payloads and swallows errors', async () => {
    const callService = vi.fn().mockRejectedValueOnce(new Error('offline'));
    const hass = hassWithTelemetryService(callService);

    expect(() =>
      reportTelemetry(hass, {
        event: 'card_viewed',
        card_type: 'full',
        source: 'card',
      })
    ).not.toThrow();

    await Promise.resolve();

    expect(callService).toHaveBeenCalledWith(
      'autosnooze',
      'report_telemetry',
      {
        event: 'card_viewed',
        source: 'card',
        card_type: 'full',
      },
      undefined,
      false
    );
  });

  test('disables HA notifyOnError so telemetry failures never toast', async () => {
    const callService = vi.fn().mockRejectedValueOnce({
      code: 'service_validation_error',
      message: 'Validation error: ...',
    });
    const hass = hassWithTelemetryService(callService);

    expect(() =>
      reportTelemetry(hass, {
        event: 'wake_clicked',
        properties: { scope: 'one' },
        source: 'card',
      })
    ).not.toThrow();

    await expect(Promise.resolve()).resolves.toBeUndefined();
    expect(callService.mock.calls[0][4]).toBe(false);
  });

  test('omits nullish optional fields so HA schema does not 400', () => {
    const callService = vi.fn();
    const hass = hassWithTelemetryService(callService);

    reportTelemetry(hass, {
      event: 'selection_feature_used',
      source: 'card',
    });

    expect(callService).toHaveBeenCalledWith(
      'autosnooze',
      'report_telemetry',
      {
        event: 'selection_feature_used',
        source: 'card',
      },
      undefined,
      false
    );
    expect(callService.mock.calls[0][2]).not.toHaveProperty('properties');
    expect(callService.mock.calls[0][2]).not.toHaveProperty('card_type');
  });

  test('calls service for other valid card events', () => {
    const callService = vi.fn();
    const hass = hassWithTelemetryService(callService);

    reportTelemetry(hass, {
      event: 'selection_feature_used',
      source: 'card',
    });
    reportTelemetry(hass, {
      event: 'duration_option_selected',
      properties: { duration_minutes: 30 },
      source: 'card',
    });
    reportTelemetry(hass, {
      event: 'confirmation_result',
      source: 'card',
    });

    expect(callService).toHaveBeenCalledTimes(3);
  });

  test('does not call service when report_telemetry is unregistered', () => {
    const callService = vi.fn();
    const hass = {
      callService,
      services: { autosnooze: { pause: {} } },
    } as unknown as HomeAssistant;

    reportTelemetry(hass, {
      event: 'card_viewed',
      card_type: 'full',
      source: 'card',
    });

    expect(callService).not.toHaveBeenCalled();
  });

  test('does not call service when sensor telemetry_enabled is false', () => {
    const callService = vi.fn();
    const hass = {
      callService,
      services: { autosnooze: { report_telemetry: {} } },
      states: {
        'sensor.autosnooze_snoozed_automations': {
          entity_id: 'sensor.autosnooze_snoozed_automations',
          attributes: { telemetry_enabled: false },
        },
      },
    } as unknown as HomeAssistant;

    reportTelemetry(hass, {
      event: 'card_viewed',
      card_type: 'full',
      source: 'card',
    });

    expect(callService).not.toHaveBeenCalled();
  });

  test('calls service when telemetry_enabled attribute is absent', () => {
    const callService = vi.fn();
    const hass = hassWithTelemetryService(callService);
    hass.states = {
      'sensor.autosnooze_snoozed_automations': {
        entity_id: 'sensor.autosnooze_snoozed_automations',
        attributes: {},
      },
    } as unknown as HomeAssistant['states'];

    reportTelemetry(hass, {
      event: 'card_viewed',
      card_type: 'full',
      source: 'card',
    });

    expect(callService).toHaveBeenCalledTimes(1);
  });

  test('calls service when telemetry_enabled attribute is true', () => {
    const callService = vi.fn();
    const hass = {
      callService,
      services: { autosnooze: { report_telemetry: {} } },
      states: {
        'sensor.autosnooze_snoozed_automations': {
          entity_id: 'sensor.autosnooze_snoozed_automations',
          attributes: { telemetry_enabled: true },
        },
      },
    } as unknown as HomeAssistant;

    reportTelemetry(hass, {
      event: 'wake_clicked',
      properties: { scope: 'one' },
      source: 'card',
    });

    expect(callService).toHaveBeenCalledWith(
      'autosnooze',
      'report_telemetry',
      {
        event: 'wake_clicked',
        properties: { scope: 'one' },
        source: 'card',
      },
      undefined,
      false
    );
    expect(callService.mock.calls[0][2]).not.toHaveProperty('card_type');
  });

  test('does not throw when callService is missing', () => {
    const hass = {} as HomeAssistant;
    expect(() =>
      reportTelemetry(hass, { event: 'selection_feature_used', source: 'card' })
    ).not.toThrow();
  });
});
