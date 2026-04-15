/**
 * Tests for recently snoozed storage functions.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  saveRecentSnoozes,
  loadRecentSnoozes,
} from '../services/storage.js';

describe('Recent Snoozes Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saves and loads recent snooze IDs', () => {
    saveRecentSnoozes(['automation.a', 'automation.b']);
    const result = loadRecentSnoozes();
    expect(result).toEqual(['automation.a', 'automation.b']);
  });

  test('merges new snoozes with previously saved entries', () => {
    saveRecentSnoozes(['automation.a', 'automation.b']);
    saveRecentSnoozes(['automation.c']);
    const result = loadRecentSnoozes();
    expect(result).toEqual(['automation.c', 'automation.a', 'automation.b']);
  });

  test('limits stored entries to 10', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `automation.item_${i}`);
    saveRecentSnoozes(ids);
    expect(loadRecentSnoozes().length).toBe(10);
  });

  test('filters out entries older than 30 days', () => {
    const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
    localStorage.setItem('autosnooze_recent_snoozes', JSON.stringify([
      { id: 'automation.old', timestamp: oldTimestamp },
      { id: 'automation.fresh', timestamp: Date.now() },
    ]));
    expect(loadRecentSnoozes()).toEqual(['automation.fresh']);
  });
});
