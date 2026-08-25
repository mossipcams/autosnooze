import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import { describe, expect, test } from 'vitest';

import {
  getPausedSensorEntity,
  parsePausedContract,
  SENSOR_ENTITY_ID,
} from '../state/paused.js';
import type { HomeAssistant } from '../types/hass.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../..');
const servicesYamlPath = join(repoRoot, 'custom_components/autosnooze/services.yaml');
const automationTsPath = join(repoRoot, 'src/types/automation.ts');
const snoozeTsPath = join(repoRoot, 'src/services/snooze.ts');

const CALL_SERVICE_RE = /callService\(\s*['"]autosnooze['"]\s*,\s*['"]([^'"]+)['"]/g;

describe('parsePausedContract v1 sensor shape', () => {
  test('returns paused and scheduled maps from a v1 payload', () => {
    const paused = {
      'automation.a': {
        friendly_name: 'A',
        resume_at: '2026-08-18T12:00:00+00:00',
        paused_at: '2026-08-18T10:00:00+00:00',
        days: 0,
        hours: 2,
        minutes: 0,
      },
    };
    const scheduled = {
      'automation.b': {
        friendly_name: 'B',
        disable_at: '2026-08-18T14:00:00+00:00',
        resume_at: '2026-08-18T16:00:00+00:00',
      },
    };

    const result = parsePausedContract({
      schema_version: 1,
      paused,
      scheduled,
    });

    expect(result.paused).toEqual(paused);
    expect(result.scheduled).toEqual(scheduled);
    expect(Object.keys(result.paused).length).toBeGreaterThan(0);
    expect(Object.keys(result.scheduled).length).toBeGreaterThan(0);
  });

  test('returns empty maps when v1 payload omits paused and scheduled', () => {
    const result = parsePausedContract({ schema_version: 1 });
    expect(result.paused).toEqual({});
    expect(result.scheduled).toEqual({});
  });
});

describe('getPausedSensorEntity', () => {
  test('prefers sensor.autosnooze_snoozed_automations when it has v1 contract keys', () => {
    const preferred = {
      entity_id: SENSOR_ENTITY_ID,
      state: '1',
      attributes: {
        schema_version: 1,
        paused: { 'automation.a': { friendly_name: 'A', resume_at: 't', paused_at: 't' } },
        scheduled: {},
      },
    };
    const other = {
      entity_id: 'sensor.autosnooze_snoozed_automations_copy',
      state: '0',
      attributes: {
        schema_version: 1,
        paused: {},
        scheduled: { 'automation.b': { friendly_name: 'B', disable_at: 't', resume_at: 't' } },
      },
    };

    const hass = {
      states: {
        [SENSOR_ENTITY_ID]: preferred,
        'sensor.autosnooze_snoozed_automations_copy': other,
      },
    } as unknown as HomeAssistant;

    expect(getPausedSensorEntity(hass)?.entity_id).toBe(SENSOR_ENTITY_ID);
  });
});

describe('card service and type contracts', () => {
  test('PauseServiceParams field names match yaml pause service contract', () => {
    const automationTs = readFileSync(automationTsPath, 'utf-8');
    const iface = automationTs.match(/export interface PauseServiceParams[\s\S]*?\{([\s\S]*?)\n\}/);
    expect(iface).not.toBeNull();
    const tsFields = [...(iface![1].matchAll(/^\s+(\w+)\??:/gm))].map((match) => match[1]);
    const servicesYaml = parseYaml(readFileSync(servicesYamlPath, 'utf-8')) as {
      pause: { fields: Record<string, unknown>; target?: { entity?: unknown } };
    };
    const yamlFields = new Set(Object.keys(servicesYaml.pause.fields));
    const yamlTargetFields = servicesYaml.pause.target?.entity ? new Set(['entity_id']) : new Set<string>();

    for (const field of tsFields) {
      expect(
        yamlFields.has(field) || yamlTargetFields.has(field),
        `${field} not in services.yaml pause fields or target`
      ).toBe(true);
    }
    expect(tsFields).not.toContain('resume_preset');
  });

  test('snooze.ts callService names exclude HA-UI-only pause_by_area and pause_by_label', () => {
    const source = readFileSync(snoozeTsPath, 'utf-8');
    const names = [...source.matchAll(CALL_SERVICE_RE)].map((match) => match[1]);
    expect(names.length).toBeGreaterThan(0);
    expect(names).not.toContain('pause_by_area');
    expect(names).not.toContain('pause_by_label');
  });
});
