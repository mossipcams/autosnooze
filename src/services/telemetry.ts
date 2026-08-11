/**
 * Fire-and-forget product telemetry via the AutoSnooze backend.
 */

import type { HomeAssistant } from '../types/hass.js';

export interface ReportTelemetryInput {
  event: string;
  properties?: Record<string, string | number | boolean>;
  source?: string;
  card_type?: 'full' | 'snoozed_only';
}

export function reportTelemetry(hass: HomeAssistant, input: ReportTelemetryInput): void {
  try {
    const result = hass.callService('autosnooze', 'report_telemetry', {
      event: input.event,
      properties: input.properties,
      source: input.source ?? 'card',
      card_type: input.card_type,
    });
    void Promise.resolve(result).catch(() => undefined);
  } catch {
    // never interrupt card actions
  }
}
