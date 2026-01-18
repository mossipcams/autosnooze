/**
 * Tests for the storage service - localStorage persistence for user preferences.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  saveLastDuration,
  loadLastDuration,
  clearLastDuration,
  type LastDurationData,
} from '../src/services/storage.js';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveLastDuration', () => {
    test('saves duration to localStorage', () => {
      const duration = { days: 0, hours: 2, minutes: 30 };
      saveLastDuration(duration, 150);

      const stored = localStorage.getItem('autosnooze_last_duration');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!) as LastDurationData;
      expect(parsed.minutes).toBe(150);
      expect(parsed.duration).toEqual(duration);
      expect(typeof parsed.timestamp).toBe('number');
    });

    test('overwrites previous saved duration', () => {
      const duration1 = { days: 0, hours: 1, minutes: 0 };
      saveLastDuration(duration1, 60);

      const duration2 = { days: 1, hours: 0, minutes: 0 };
      saveLastDuration(duration2, 1440);

      const stored = localStorage.getItem('autosnooze_last_duration');
      const parsed = JSON.parse(stored!) as LastDurationData;
      expect(parsed.minutes).toBe(1440);
      expect(parsed.duration.days).toBe(1);
    });

    test('handles localStorage errors gracefully', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      // Should not throw
      expect(() => {
        saveLastDuration({ days: 0, hours: 1, minutes: 0 }, 60);
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('loadLastDuration', () => {
    test('returns null when no stored duration', () => {
      const result = loadLastDuration();
      expect(result).toBeNull();
    });

    test('returns parsed duration when valid data exists', () => {
      const data: LastDurationData = {
        minutes: 150,
        duration: { days: 0, hours: 2, minutes: 30 },
        timestamp: Date.now(),
      };
      localStorage.setItem('autosnooze_last_duration', JSON.stringify(data));

      const result = loadLastDuration();
      expect(result).not.toBeNull();
      expect(result!.minutes).toBe(150);
      expect(result!.duration.hours).toBe(2);
      expect(result!.duration.minutes).toBe(30);
    });

    test('returns null for corrupted JSON', () => {
      localStorage.setItem('autosnooze_last_duration', 'not valid json');

      const result = loadLastDuration();
      expect(result).toBeNull();
    });

    test('returns null for invalid structure - missing minutes', () => {
      const data = {
        duration: { days: 0, hours: 2, minutes: 30 },
        timestamp: Date.now(),
      };
      localStorage.setItem('autosnooze_last_duration', JSON.stringify(data));

      const result = loadLastDuration();
      expect(result).toBeNull();
    });

    test('returns null for invalid structure - missing duration fields', () => {
      const data = {
        minutes: 150,
        duration: { hours: 2 }, // missing days and minutes
        timestamp: Date.now(),
      };
      localStorage.setItem('autosnooze_last_duration', JSON.stringify(data));

      const result = loadLastDuration();
      expect(result).toBeNull();
    });

    test('returns null for invalid structure - wrong types', () => {
      const data = {
        minutes: '150', // should be number
        duration: { days: 0, hours: 2, minutes: 30 },
        timestamp: Date.now(),
      };
      localStorage.setItem('autosnooze_last_duration', JSON.stringify(data));

      const result = loadLastDuration();
      expect(result).toBeNull();
    });

    test('handles localStorage errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => {
        throw new Error('SecurityError');
      };

      const result = loadLastDuration();
      expect(result).toBeNull();

      localStorage.getItem = originalGetItem;
    });
  });

  describe('clearLastDuration', () => {
    test('removes duration from localStorage', () => {
      localStorage.setItem('autosnooze_last_duration', JSON.stringify({ minutes: 60 }));
      expect(localStorage.getItem('autosnooze_last_duration')).not.toBeNull();

      clearLastDuration();

      expect(localStorage.getItem('autosnooze_last_duration')).toBeNull();
    });

    test('does nothing when no duration stored', () => {
      // Should not throw
      expect(() => clearLastDuration()).not.toThrow();
    });

    test('handles localStorage errors gracefully', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = () => {
        throw new Error('SecurityError');
      };

      // Should not throw
      expect(() => clearLastDuration()).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('Round-trip', () => {
    test('save then load returns equivalent data', () => {
      const duration = { days: 1, hours: 12, minutes: 45 };
      const totalMinutes = 1 * 1440 + 12 * 60 + 45; // 2205

      saveLastDuration(duration, totalMinutes);
      const loaded = loadLastDuration();

      expect(loaded).not.toBeNull();
      expect(loaded!.minutes).toBe(totalMinutes);
      expect(loaded!.duration).toEqual(duration);
    });

    test('save, clear, load returns null', () => {
      saveLastDuration({ days: 0, hours: 1, minutes: 0 }, 60);
      clearLastDuration();
      const result = loadLastDuration();

      expect(result).toBeNull();
    });
  });
});
