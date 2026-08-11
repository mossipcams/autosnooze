/**
 * Fire-and-forget product telemetry via the AutoSnooze backend.
 */

import type { HomeAssistant } from '../types/hass.js';
import type { ReportTelemetryInput } from './telemetry-schema.js';

export type { ReportTelemetryInput };

const SENSOR_ENTITY_ID = 'sensor.autosnooze_snoozed_automations';

function isTelemetryEnabled(hass: HomeAssistant): boolean {
  const attributes = hass.states?.[SENSOR_ENTITY_ID]?.attributes as
    | { telemetry_enabled?: unknown }
    | undefined;
  const enabled = attributes?.telemetry_enabled;
  // Default ON when the attribute is absent (matches backend options default).
  return enabled !== false;
}

export function reportTelemetry(hass: HomeAssistant, input: ReportTelemetryInput): void {
  if (!hass.services?.autosnooze?.report_telemetry || typeof hass.callService !== 'function') {
    return;
  }
  if (!isTelemetryEnabled(hass)) {
    return;
  }

  try {
    const serviceData: Record<string, unknown> = {
      event: input.event,
      source: input.source ?? 'card',
    };
    if ('properties' in input && input.properties !== undefined && input.properties !== null) {
      serviceData.properties = input.properties;
    }
    if ('card_type' in input && input.card_type !== undefined && input.card_type !== null) {
      serviceData.card_type = input.card_type;
    }
    const result = hass.callService('autosnooze', 'report_telemetry', serviceData);
    void Promise.resolve(result).catch(() => undefined);
  } catch {
    // never interrupt card actions
  }
}
