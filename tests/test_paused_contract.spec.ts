// @ts-nocheck -- contract parser tests focus on runtime behavior
/**
 * Contract tests for parsing AutoSnooze paused/scheduled sensor payloads.
 */

import { describe, test, expect } from 'vitest';
import {
  SENSOR_ENTITY_ID,
  PAUSED_CONTRACT_VERSION,
  getPaused,
  getPausedGroupedByResumeTime,
  getScheduled,
  parsePausedContract,
} from '../src/state/paused.js';
import { SENSOR_SCHEMA_VERSION } from '../src/types/automation.js';

function pausedEntry(overrides = {}) {
  return {
    friendly_name: 'Kitchen',
    resume_at: '2030-01-01T12:00:00+00:00',
    paused_at: '2030-01-01T11:00:00+00:00',
    days: 0,
    hours: 1,
    minutes: 0,
    ...overrides,
  };
}

function scheduledEntry(overrides = {}) {
  return {
    friendly_name: 'Porch',
    disable_at: '2030-01-01T10:00:00+00:00',
    resume_at: '2030-01-01T12:00:00+00:00',
    ...overrides,
  };
}

describe('Paused Contract Parser', () => {
  test('uses shared frontend schema constant', () => {
    expect(PAUSED_CONTRACT_VERSION).toBe(SENSOR_SCHEMA_VERSION);
  });

  test('parses versioned payload with paused and scheduled roots', () => {
    const parsed = parsePausedContract({
      schema_version: SENSOR_SCHEMA_VERSION,
      paused: { 'automation.kitchen': pausedEntry() },
      scheduled: { 'automation.porch': scheduledEntry() },
    });

    expect(parsed.paused['automation.kitchen']?.friendly_name).toBe('Kitchen');
    expect(parsed.scheduled['automation.porch']?.friendly_name).toBe('Porch');
  });

  test('returns empty maps when versioned payload is missing required roots', () => {
    const parsed = parsePausedContract({ schema_version: SENSOR_SCHEMA_VERSION });
    expect(parsed.paused).toEqual({});
    expect(parsed.scheduled).toEqual({});
  });

  test('falls back to legacy keys when schema version is unknown', () => {
    const parsed = parsePausedContract({
      schema_version: SENSOR_SCHEMA_VERSION + 998,
      paused_automations: { 'automation.legacy': pausedEntry({ friendly_name: 'Legacy' }) },
      scheduled_snoozes: { 'automation.legacy_sched': scheduledEntry({ friendly_name: 'Legacy Scheduled' }) },
    });

    expect(parsed.paused['automation.legacy']?.friendly_name).toBe('Legacy');
    expect(parsed.scheduled['automation.legacy_sched']?.friendly_name).toBe('Legacy Scheduled');
  });

  test('supports backward-compatible parsing without schema version', () => {
    const parsed = parsePausedContract({
      paused_automations: { 'automation.old': pausedEntry({ friendly_name: 'Old' }) },
      scheduled_snoozes: { 'automation.old_sched': scheduledEntry({ friendly_name: 'Old Scheduled' }) },
    });

    expect(parsed.paused['automation.old']?.friendly_name).toBe('Old');
    expect(parsed.scheduled['automation.old_sched']?.friendly_name).toBe('Old Scheduled');
  });

  test('getPaused/getScheduled read parsed values from hass sensor state', () => {
    const hass = createMockHass({
      states: {
        [SENSOR_ENTITY_ID]: {
          entity_id: SENSOR_ENTITY_ID,
          state: '0',
          attributes: {
            schema_version: 999,
            paused_automations: { 'automation.a': pausedEntry({ friendly_name: 'A' }) },
            scheduled_snoozes: { 'automation.b': scheduledEntry({ friendly_name: 'B' }) },
          },
          last_changed: '2030-01-01T00:00:00+00:00',
          last_updated: '2030-01-01T00:00:00+00:00',
          context: { id: 'ctx', parent_id: null, user_id: null },
        },
      },
    });

    expect(getPaused(hass)['automation.a']?.friendly_name).toBe('A');
    expect(getScheduled(hass)['automation.b']?.friendly_name).toBe('B');
  });

  test('reuses paused and scheduled snapshots for the same sensor attributes object', () => {
    const attributes = {
      schema_version: SENSOR_SCHEMA_VERSION,
      paused: {
        'automation.a': pausedEntry({ friendly_name: 'A' }),
      },
      scheduled: {
        'automation.b': scheduledEntry({ friendly_name: 'B' }),
      },
    };
    const hass = createMockHass({
      states: {
        [SENSOR_ENTITY_ID]: {
          entity_id: SENSOR_ENTITY_ID,
          state: '0',
          attributes,
        },
      },
    });

    const pausedFirst = getPaused(hass);
    const pausedSecond = getPaused(hass);
    const scheduledFirst = getScheduled(hass);
    const scheduledSecond = getScheduled(hass);
    const groupsFirst = getPausedGroupedByResumeTime(hass);
    const groupsSecond = getPausedGroupedByResumeTime(hass);

    expect(pausedSecond).toBe(pausedFirst);
    expect(scheduledSecond).toBe(scheduledFirst);
    expect(groupsSecond).toBe(groupsFirst);
  });

  test('invalidates memoized snapshot when sensor attributes object changes', () => {
    const hass = createMockHass({
      states: {
        [SENSOR_ENTITY_ID]: {
          entity_id: SENSOR_ENTITY_ID,
          state: '0',
          attributes: {
            schema_version: SENSOR_SCHEMA_VERSION,
            paused: {
              'automation.a': pausedEntry({ friendly_name: 'A' }),
            },
            scheduled: {},
          },
        },
      },
    });

    const firstPaused = getPaused(hass);
    const firstGroups = getPausedGroupedByResumeTime(hass);

    hass.states[SENSOR_ENTITY_ID] = {
      ...hass.states[SENSOR_ENTITY_ID],
      attributes: {
        schema_version: SENSOR_SCHEMA_VERSION,
        paused: {
          'automation.c': pausedEntry({ friendly_name: 'C' }),
        },
        scheduled: {
          'automation.d': scheduledEntry({ friendly_name: 'D' }),
        },
      },
    };

    const secondPaused = getPaused(hass);
    const secondScheduled = getScheduled(hass);
    const secondGroups = getPausedGroupedByResumeTime(hass);

    expect(secondPaused).not.toBe(firstPaused);
    expect(secondGroups).not.toBe(firstGroups);
    expect(secondPaused['automation.c']?.friendly_name).toBe('C');
    expect(secondScheduled['automation.d']?.friendly_name).toBe('D');
  });
});
