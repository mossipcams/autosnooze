import { describe, expect, test } from 'vitest';

import { parsePausedContract } from '../src/state/paused.js';

const normalizedPaused = {
  'automation.kitchen': {
    friendly_name: 'Kitchen',
    resume_at: '2026-04-06T18:00:00Z',
    paused_at: '2026-04-06T17:00:00Z',
  },
};

const normalizedScheduled = {
  'automation.porch': {
    friendly_name: 'Porch',
    disable_at: '2026-04-06T19:00:00Z',
    resume_at: '2026-04-06T20:00:00Z',
  },
};

describe('PR #329 Contract Compatibility', () => {
  test('merges unversioned normalized and legacy roots during transition', () => {
    const result = parsePausedContract({
      paused: normalizedPaused,
      scheduled_snoozes: normalizedScheduled,
    });

    expect(result).toEqual({
      paused: normalizedPaused,
      scheduled: normalizedScheduled,
    });
  });

  test('prefers unversioned normalized roots over legacy ones when both are present', () => {
    const result = parsePausedContract({
      paused: normalizedPaused,
      scheduled: normalizedScheduled,
      paused_automations: {
        'automation.kitchen': {
          friendly_name: 'Legacy Kitchen',
          resume_at: '1999-01-01T01:00:00Z',
          paused_at: '1999-01-01T00:00:00Z',
        },
      },
      scheduled_snoozes: {
        'automation.porch': {
          friendly_name: 'Legacy Porch',
          disable_at: '1999-01-01T02:00:00Z',
          resume_at: '1999-01-01T03:00:00Z',
        },
      },
    });

    expect(result).toEqual({
      paused: normalizedPaused,
      scheduled: normalizedScheduled,
    });
  });

  test('uses only the versioned normalized contract when schema_version is present', () => {
    const result = parsePausedContract({
      schema_version: 1,
      paused: normalizedPaused,
      scheduled: normalizedScheduled,
      paused_automations: {
        'automation.legacy_only': {
          friendly_name: 'Legacy Only',
          resume_at: '1999-01-01T01:00:00Z',
          paused_at: '1999-01-01T00:00:00Z',
        },
      },
      scheduled_snoozes: {},
    });

    expect(result).toEqual({
      paused: normalizedPaused,
      scheduled: normalizedScheduled,
    });
  });
});
