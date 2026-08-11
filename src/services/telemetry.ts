/**
 * Fire-and-forget product telemetry via the AutoSnooze backend.
 */

import type { HomeAssistant } from '../types/hass.js';
import { reportTelemetryInputSchema, type ReportTelemetryInput } from './telemetry-schema.js';

export type { ReportTelemetryInput };

export function reportTelemetry(hass: HomeAssistant, input: ReportTelemetryInput): void {
  const parsed = reportTelemetryInputSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }

  const validated = parsed.data;

  try {
    const result = hass.callService('autosnooze', 'report_telemetry', {
      event: validated.event,
      properties: 'properties' in validated ? validated.properties : undefined,
      source: validated.source ?? 'card',
      card_type: 'card_type' in validated ? validated.card_type : undefined,
    });
    void Promise.resolve(result).catch(() => undefined);
  } catch {
    // never interrupt card actions
  }
}
