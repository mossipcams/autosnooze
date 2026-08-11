import { describe, expect, test, vi } from 'vitest';

import { reportTelemetry } from '../services/telemetry.js';
import type { HomeAssistant } from '../types/hass.js';

describe('reportTelemetry', () => {
  test('calls autosnooze.report_telemetry and swallows errors', async () => {
    const callService = vi.fn().mockRejectedValueOnce(new Error('offline'));
    const hass = { callService } as unknown as HomeAssistant;

    reportTelemetry(hass, {
      event: 'card_viewed',
      card_type: 'full',
      source: 'card',
    });

    await Promise.resolve();

    expect(callService).toHaveBeenCalledWith('autosnooze', 'report_telemetry', {
      event: 'card_viewed',
      properties: undefined,
      source: 'card',
      card_type: 'full',
    });
  });

  test('does not throw when callService is missing', () => {
    const hass = {} as HomeAssistant;
    expect(() =>
      reportTelemetry(hass, { event: 'selection_feature_used', properties: { method: 'all' } })
    ).not.toThrow();
  });
});
