import { describe, expect, test } from 'vitest';
import {
  durationToMinutes,
  isDurationValid,
  minutesToDuration,
  parseDurationInput,
} from '../utils/duration-parsing.js';
import {
  getPaused,
  getPausedGroupedByResumeTime,
  getPausedSnapshot,
  getScheduled,
  parsePausedContract,
  SENSOR_ENTITY_ID,
} from '../state/paused.js';
import type { HomeAssistant, PausedAutomationAttribute } from '../types/hass.js';

const pausedEarly: PausedAutomationAttribute = {
  friendly_name: 'Early',
  resume_at: '2026-04-29T12:30:00',
  paused_at: '2026-04-29T12:00:00',
  days: 0,
  hours: 0,
  minutes: 30,
};

const pausedLate: PausedAutomationAttribute = {
  friendly_name: 'Late',
  resume_at: '2026-04-29T13:30:00',
  paused_at: '2026-04-29T12:00:00',
  days: 0,
  hours: 1,
  minutes: 30,
  disable_at: '2026-04-29T12:15:00',
};

function createHass(attributes?: Record<string, unknown>): HomeAssistant {
  return {
    states: attributes
      ? {
          [SENSOR_ENTITY_ID]: {
            entity_id: SENSOR_ENTITY_ID,
            state: '2',
            attributes,
          },
        }
      : {},
  } as unknown as HomeAssistant;
}

describe('duration parsing mutation boundaries', () => {
  test('parses spaces, multi-digit values, decimals, mixed case, and normalization exactly', () => {
    expect(parseDurationInput('  12H 15M  ')).toEqual({ days: 0, hours: 12, minutes: 15 });
    expect(parseDurationInput('10d')).toEqual({ days: 10, hours: 0, minutes: 0 });
    expect(parseDurationInput('1.25h')).toEqual({ days: 0, hours: 1, minutes: 15 });
    expect(parseDurationInput('2.5d')).toEqual({ days: 2, hours: 12, minutes: 0 });
    expect(parseDurationInput('1d 2.5h 30m')).toEqual({ days: 1, hours: 3, minutes: 0 });
    expect(parseDurationInput('1441')).toEqual({ days: 1, hours: 0, minutes: 1 });
    expect(parseDurationInput('59.5')).toEqual({ days: 0, hours: 1, minutes: 0 });
  });

  test('allows zero-valued units when another unit makes the duration positive', () => {
    expect(parseDurationInput('0d 0h 1m')).toEqual({ days: 0, hours: 0, minutes: 1 });
    expect(parseDurationInput('0d 1h 0m')).toEqual({ days: 0, hours: 1, minutes: 0 });
    expect(parseDurationInput('1d 0h 0m')).toEqual({ days: 1, hours: 0, minutes: 0 });
  });

  test('rejects empty, zero, negative, malformed, unsupported min suffix, and garbage-separated units', () => {
    expect(parseDurationInput('')).toBeNull();
    expect(parseDurationInput('   ')).toBeNull();
    expect(parseDurationInput('0')).toBeNull();
    expect(parseDurationInput('-5')).toBeNull();
    expect(parseDurationInput('abc')).toBeNull();
    expect(parseDurationInput('1min')).toBeNull();
    expect(parseDurationInput('1xd')).toBeNull();
    expect(parseDurationInput('2yh')).toBeNull();
    expect(parseDurationInput('3qm')).toBeNull();
    expect(isDurationValid('90m')).toBe(true);
    expect(isDurationValid('0m')).toBe(false);
  });

  test('converts between parsed durations and total minutes at day/hour boundaries', () => {
    expect(durationToMinutes({ days: 1, hours: 2, minutes: 3 })).toBe(1563);
    expect(minutesToDuration(0)).toEqual({ days: 0, hours: 0, minutes: 0 });
    expect(minutesToDuration(59)).toEqual({ days: 0, hours: 0, minutes: 59 });
    expect(minutesToDuration(60)).toEqual({ days: 0, hours: 1, minutes: 0 });
    expect(minutesToDuration(1439)).toEqual({ days: 0, hours: 23, minutes: 59 });
    expect(minutesToDuration(1440)).toEqual({ days: 1, hours: 0, minutes: 0 });
    expect(minutesToDuration(1501)).toEqual({ days: 1, hours: 1, minutes: 1 });
  });
});

describe('paused snapshot mutation boundaries', () => {
  test('parsePausedContract rejects non-records, arrays, invalid versioned roots, and unsupported versions', () => {
    expect(parsePausedContract(null)).toEqual({ paused: {}, scheduled: {} });
    expect(parsePausedContract([])).toEqual({ paused: {}, scheduled: {} });
    expect(parsePausedContract({ schema_version: 1, paused: [], scheduled: {} })).toEqual({
      paused: {},
      scheduled: {},
    });
    expect(parsePausedContract({ schema_version: 1, paused: {}, scheduled: [] })).toEqual({
      paused: {},
      scheduled: {},
    });
    expect(parsePausedContract({ schema_version: 999, paused: { ignored: pausedEarly } })).toEqual({
      paused: {},
      scheduled: {},
    });
  });

  test('parsePausedContract accepts versioned, transitional, and legacy contracts without rewriting maps', () => {
    const paused = { 'automation.early': pausedEarly };
    const scheduled = { 'automation.late': { friendly_name: 'Late', resume_at: '2026-04-29T13:30:00' } };

    expect(parsePausedContract({ schema_version: 1, paused, scheduled })).toEqual({ paused, scheduled });
    expect(parsePausedContract({ paused, scheduled: {} })).toEqual({ paused, scheduled: {} });
    expect(parsePausedContract({ paused_automations: paused, scheduled_snoozes: scheduled })).toEqual({
      paused,
      scheduled,
    });
    expect(parsePausedContract({ paused: {}, scheduled: {} })).toEqual({ paused: {}, scheduled: {} });
  });

  test('getPausedSnapshot handles missing hass pieces, caches stable roots, invalidates root changes, and sorts groups', () => {
    expect(getPausedSnapshot(undefined as unknown as HomeAssistant)).toEqual({
      paused: {},
      scheduled: {},
      groups: [],
    });
    expect(getPausedSnapshot({} as HomeAssistant)).toEqual({
      paused: {},
      scheduled: {},
      groups: [],
    });
    expect(getPausedSnapshot({ states: {} } as unknown as HomeAssistant)).toEqual({
      paused: {},
      scheduled: {},
      groups: [],
    });

    const paused = {
      'automation.late': pausedLate,
      'automation.early_one': pausedEarly,
      'automation.early_two': { ...pausedEarly, friendly_name: 'Early Two' },
    };
    const scheduled = {
      'automation.scheduled': {
        friendly_name: 'Scheduled',
        disable_at: '2026-04-29T12:15:00',
        resume_at: '2026-04-29T14:00:00',
      },
    };
    const attributes = { schema_version: 1, paused, scheduled };
    const hass = createHass(attributes);

    const first = getPausedSnapshot(hass);
    expect(getPausedSnapshot(hass)).toBe(first);
    expect(first.paused).toBe(paused);
    expect(first.scheduled).toBe(scheduled);
    expect(first.groups.map((group) => group.resumeAt)).toEqual([
      '2026-04-29T12:30:00',
      '2026-04-29T13:30:00',
    ]);
    expect(first.groups[0]?.automations.map((automation) => automation.entity_id)).toEqual([
      'automation.early_one',
      'automation.early_two',
    ]);
    expect(first.groups[1]?.disableAt).toBe('2026-04-29T12:15:00');

    const nextPaused = { ...paused };
    const second = getPausedSnapshot(createHass({ schema_version: 1, paused: nextPaused, scheduled }));
    expect(second).not.toBe(first);
    expect(second.paused).toBe(nextPaused);
  });

  test('convenience accessors return the parsed maps and grouped view', () => {
    const paused = { 'automation.early': pausedEarly };
    const scheduled = {
      'automation.scheduled': {
        friendly_name: 'Scheduled',
        resume_at: '2026-04-29T14:00:00',
      },
    };
    const hass = createHass({ schema_version: 1, paused, scheduled });

    expect(getPaused(hass)).toBe(paused);
    expect(getScheduled(hass)).toBe(scheduled);
    expect(getPausedGroupedByResumeTime(hass)).toEqual([
      {
        resumeAt: '2026-04-29T12:30:00',
        disableAt: undefined,
        automations: [
          {
            entity_id: 'automation.early',
            friendly_name: 'Early',
            resume_at: '2026-04-29T12:30:00',
            paused_at: '2026-04-29T12:00:00',
            days: 0,
            hours: 0,
            minutes: 30,
            disable_at: undefined,
          },
        ],
      },
    ]);
  });
});
