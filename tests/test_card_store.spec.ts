// @ts-nocheck -- focused runtime store tests
/**
 * Tests for card state store transitions.
 */

import { describe, test, expect } from 'vitest';
import { createCardStore } from '../src/state/card-store.js';

describe('Card Store', () => {
  test('initializes with sensible defaults', () => {
    const store = createCardStore();
    const state = store.getState();

    expect(state.selected).toEqual([]);
    expect(state.filterTab).toBe('all');
    expect(state.search).toBe('');
    expect(state.customDuration).toEqual({ days: 0, hours: 0, minutes: 30 });
    expect(state.customDurationInput).toBe('30m');
    expect(state.durationMs).toBe(30 * 60 * 1000);
  });

  test('selection transitions support set/toggle/clear', () => {
    const store = createCardStore();

    store.setSelection(['automation.a']);
    expect(store.getState().selected).toEqual(['automation.a']);

    store.toggleSelection('automation.b');
    expect(store.getState().selected).toEqual(['automation.a', 'automation.b']);

    store.toggleSelection('automation.a');
    expect(store.getState().selected).toEqual(['automation.b']);

    store.clearSelection();
    expect(store.getState().selected).toEqual([]);
  });

  test('filter transitions update tab and search independently', () => {
    const store = createCardStore();

    store.setFilterTab('areas');
    store.setSearch('kitchen');

    expect(store.getState().filterTab).toBe('areas');
    expect(store.getState().search).toBe('kitchen');
  });

  test('duration source-of-truth derives durationMs from parsed duration', () => {
    const store = createCardStore();

    store.setDuration({ days: 0, hours: 1, minutes: 30 }, '1h30m');
    const state = store.getState();

    expect(state.customDuration).toEqual({ days: 0, hours: 1, minutes: 30 });
    expect(state.customDurationInput).toBe('1h30m');
    expect(state.durationMs).toBe(90 * 60 * 1000);
  });
});
