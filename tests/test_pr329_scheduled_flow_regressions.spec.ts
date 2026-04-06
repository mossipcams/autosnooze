import { describe, expect, test } from 'vitest';

import { validateScheduledPauseInput } from '../src/features/scheduled-snooze/index.js';

describe('PR #329 Scheduled Flow Regressions', () => {
  test('rejects invalid resume date strings instead of treating them as valid', () => {
    const result = validateScheduledPauseInput({
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '2026-02-31',
      resumeAtTime: '12:00',
      nowMs: new Date('2026-02-01T12:00:00Z').getTime(),
    });

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/resume/i);
    }
  });

  test('rejects invalid disable timestamps instead of silently accepting them', () => {
    const result = validateScheduledPauseInput({
      disableAtDate: '2026-04-06',
      disableAtTime: '24:61',
      resumeAtDate: '2026-04-07',
      resumeAtTime: '12:00',
      nowMs: new Date('2026-04-06T12:00:00Z').getTime(),
    });

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/snooze/i);
    }
  });
});
