/**
 * Property-based tests (using fast-check) to evaluate which known defects PBT
 * would catch in the TypeScript frontend utilities.
 *
 * These tests verify invariants/properties that broken code would violate.
 * They complement the Python hypothesis tests by covering the frontend logic.
 *
 * Targeted areas:
 * - Duration parsing: round-trip, normalization, boundary handling
 * - Time formatting: consistency, countdown correctness, singular/plural
 * - DateTime utilities: timezone offset, date generation uniqueness
 */

import { describe, test, expect, vi } from 'vitest';
import fc from 'fast-check';
import { parseDurationInput, durationToMinutes, minutesToDuration, isDurationValid } from '../src/utils/duration-parsing.js';
import { formatCountdown, formatDuration, formatDurationShort } from '../src/utils/time-formatting.js';
import { combineDateTime, generateDateOptions } from '../src/utils/datetime.js';
import { TIME_MS, MINUTES_PER } from '../src/constants/index.js';

// ============================================================================
// Duration Parsing Properties
// ============================================================================

describe('PBT: Duration Parsing - round-trip properties', () => {
  test('minutesToDuration(durationToMinutes(d)) is identity for normalized durations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 }),   // days
        fc.integer({ min: 0, max: 23 }),     // hours
        fc.integer({ min: 0, max: 59 }),     // minutes
        (days, hours, minutes) => {
          // Skip zero duration (parseDurationInput rejects it)
          fc.pre(days + hours + minutes > 0);

          const total = durationToMinutes({ days, hours, minutes });
          const reconstructed = minutesToDuration(total);

          expect(reconstructed.days).toBe(days);
          expect(reconstructed.hours).toBe(hours);
          expect(reconstructed.minutes).toBe(minutes);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('durationToMinutes(minutesToDuration(n)) is identity for positive integers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 525600 }),  // 1 min to 1 year
        (totalMinutes) => {
          const duration = minutesToDuration(totalMinutes);
          const result = durationToMinutes(duration);
          expect(result).toBe(totalMinutes);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('parseDurationInput always returns normalized ranges', () => {
    // Generate valid duration strings
    const durationString = fc.oneof(
      fc.integer({ min: 1, max: 9999 }).map(n => `${n}m`),
      fc.integer({ min: 1, max: 999 }).map(n => `${n}h`),
      fc.integer({ min: 1, max: 365 }).map(n => `${n}d`),
      fc.tuple(
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 1, max: 59 })
      ).map(([d, h, m]) => `${d}d ${h}h ${m}m`),
      fc.integer({ min: 1, max: 99999 }).map(n => `${n}`),  // plain minutes
    );

    fc.assert(
      fc.property(durationString, (input) => {
        const result = parseDurationInput(input);
        if (result !== null) {
          // Property: output ranges must be normalized
          expect(result.minutes).toBeGreaterThanOrEqual(0);
          expect(result.minutes).toBeLessThan(60);
          expect(result.hours).toBeGreaterThanOrEqual(0);
          expect(result.hours).toBeLessThan(24);
          expect(result.days).toBeGreaterThanOrEqual(0);
          // Property: total must be positive
          const total = durationToMinutes(result);
          expect(total).toBeGreaterThan(0);
        }
      }),
      { numRuns: 500 }
    );
  });

  test('PBT FINDING: negative values with units are silently treated as positive', () => {
    // fast-check discovered that "-1m" is parsed as "1m" because the regex
    // /(\d+(?:\.\d+)?)\s*m/ only captures digits after the minus sign.
    // The explicit `< 0` check in the code is dead code for regex matches
    // since \d+ never produces negative numbers.
    //
    // This is a real PBT finding: the parser claims to reject negatives but
    // actually silently strips the sign for unit-suffixed inputs.
    // Whether this matters depends on whether users can input negative values.
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.constantFrom('m', 'h', 'd'),
        (n, unit) => {
          const negativeInput = `-${n}${unit}`;
          const positiveInput = `${n}${unit}`;
          const negResult = parseDurationInput(negativeInput);
          const posResult = parseDurationInput(positiveInput);
          // PBT finding: negative input produces same result as positive
          // (sign is silently dropped because regex only captures \d+)
          expect(negResult).toEqual(posResult);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('parseDurationInput rejects negative plain numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -9999, max: -1 }),
        (n) => {
          // Without a unit suffix, parseFloat sees the negative sign
          const result = parseDurationInput(`${n}`);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('parseDurationInput with decimal hours produces correct minutes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),    // whole hours
        fc.integer({ min: 1, max: 9 }),       // decimal tenths
        (wholeHours, tenths) => {
          const input = `${wholeHours}.${tenths}h`;
          const result = parseDurationInput(input);
          if (result !== null) {
            const totalMinutes = durationToMinutes(result);
            const expected = Math.round(wholeHours * 60 + tenths * 6);
            expect(totalMinutes).toBe(expected);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('isDurationValid agrees with parseDurationInput', () => {
    const durationChars = fc.array(
      fc.constantFrom('0', '1', '2', '3', '5', '.', 'd', 'h', 'm', ' '),
      { minLength: 1, maxLength: 15 },
    ).map(chars => chars.join(''));

    fc.assert(
      fc.property(
        durationChars,
        (input) => {
          const parsed = parseDurationInput(input);
          const valid = isDurationValid(input);
          expect(valid).toBe(parsed !== null);
        }
      ),
      { numRuns: 300 }
    );
  });
});

// ============================================================================
// Time Formatting Properties
// ============================================================================

describe('PBT: Time Formatting - consistency properties', () => {
  test('formatDuration includes all non-zero components', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 }),
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        (days, hours, minutes) => {
          fc.pre(days + hours + minutes > 0);
          const result = formatDuration(days, hours, minutes);

          if (days > 0) expect(result).toContain('day');
          if (hours > 0) expect(result).toContain('hour');
          if (minutes > 0) expect(result).toContain('minute');
        }
      ),
      { numRuns: 300 }
    );
  });

  test('formatDuration uses correct singular/plural forms', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        fc.integer({ min: 1, max: 23 }),
        fc.integer({ min: 1, max: 59 }),
        (days, hours, minutes) => {
          const result = formatDuration(days, hours, minutes);

          // Singular (no trailing 's') when value is 1
          if (days === 1) {
            expect(result).toContain('1 day');
            expect(result).not.toMatch(/1 days/);
          }
          if (days > 1) {
            expect(result).toContain(`${days} days`);
          }
          if (hours === 1) {
            expect(result).toContain('1 hour');
            expect(result).not.toMatch(/1 hours/);
          }
          if (hours > 1) {
            expect(result).toContain(`${hours} hours`);
          }
          if (minutes === 1) {
            expect(result).toContain('1 minute');
            expect(result).not.toMatch(/1 minutes/);
          }
          if (minutes > 1) {
            expect(result).toContain(`${minutes} minutes`);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('formatDurationShort is parseable back via parseDurationInput', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 }),
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        (days, hours, minutes) => {
          fc.pre(days + hours + minutes > 0);
          const short = formatDurationShort(days, hours, minutes);
          const parsed = parseDurationInput(short);

          // Property: short format should round-trip through parser
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.days).toBe(days);
            expect(parsed.hours).toBe(hours);
            expect(parsed.minutes).toBe(minutes);
          }
        }
      ),
      { numRuns: 300 }
    );
  });

  test('formatDurationShort returns "0m" for all zeros', () => {
    expect(formatDurationShort(0, 0, 0)).toBe('0m');
  });

  test('formatCountdown returns fallback for past times', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 86400000 }),   // 1ms to 1 day in past
        fc.string({ minLength: 1, maxLength: 20 }),
        (msInPast, fallback) => {
          const pastTime = new Date(Date.now() - msInPast).toISOString();
          expect(formatCountdown(pastTime, fallback)).toBe(fallback);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('formatCountdown for future times never returns fallback', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 86400000 * 30 }),  // 2s to 30 days in future
        (msInFuture) => {
          const futureTime = new Date(Date.now() + msInFuture).toISOString();
          const result = formatCountdown(futureTime, 'EXPIRED');
          expect(result).not.toBe('EXPIRED');
          // Property: result contains time units
          expect(result).toMatch(/[dhms]/);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('formatCountdown shows days only for durations >= 1 day', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 365 }),  // days in future
        (daysAhead) => {
          const futureTime = new Date(Date.now() + daysAhead * TIME_MS.DAY + TIME_MS.HOUR).toISOString();
          const result = formatCountdown(futureTime);
          expect(result).toMatch(/^\d+d /);
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// DateTime Utility Properties
// ============================================================================

describe('PBT: DateTime Utilities - offset and generation properties', () => {
  test('combineDateTime returns null for empty inputs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '2024-01-15', ''),
        fc.constantFrom('', '', '14:30'),
        (date, time) => {
          fc.pre(!date || !time);  // At least one is empty
          expect(combineDateTime(date, time)).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });

  test('combineDateTime output contains the date and time components', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),  // safe day range
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        (year, month, day, hour, minute) => {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          const result = combineDateTime(dateStr, timeStr);

          expect(result).not.toBeNull();
          if (result) {
            // Property: output starts with the date and time
            expect(result).toContain(dateStr);
            expect(result).toContain(timeStr);
            // Property: output has timezone offset (+ or - followed by HH:MM)
            expect(result).toMatch(/[+-]\d{2}:\d{2}$/);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('generateDateOptions produces correct count of dates', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (daysAhead) => {
          const options = generateDateOptions(daysAhead);
          expect(options).toHaveLength(daysAhead);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('generateDateOptions produces unique date values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (daysAhead) => {
          const options = generateDateOptions(daysAhead);
          const values = options.map(o => o.value);
          const uniqueValues = new Set(values);
          expect(uniqueValues.size).toBe(values.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('generateDateOptions values are in ascending order', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 365 }),
        (daysAhead) => {
          const options = generateDateOptions(daysAhead);
          for (let i = 1; i < options.length; i++) {
            expect(options[i].value > options[i - 1].value).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('generateDateOptions first date is today', () => {
    const options = generateDateOptions(10);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(options[0].value).toBe(todayStr);
  });
});

// ============================================================================
// Cross-module consistency properties
// ============================================================================

describe('PBT: Cross-module consistency', () => {
  test('formatDurationShort output is parseable and matches durationToMinutes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 525600 }),
        (totalMinutes) => {
          const duration = minutesToDuration(totalMinutes);
          const formatted = formatDurationShort(duration.days, duration.hours, duration.minutes);
          const reparsed = parseDurationInput(formatted);

          expect(reparsed).not.toBeNull();
          if (reparsed) {
            const reparsedMinutes = durationToMinutes(reparsed);
            expect(reparsedMinutes).toBe(totalMinutes);
          }
        }
      ),
      { numRuns: 500 }
    );
  });
});
