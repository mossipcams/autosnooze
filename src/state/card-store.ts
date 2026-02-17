/**
 * Lightweight state store for card-local UI state.
 */

import { TIME_MS } from '../constants/index.js';
import { durationToMinutes } from '../utils/index.js';
import type { ParsedDuration } from '../types/automation.js';
import type { FilterTab } from '../types/card.js';

export interface CardStoreState {
  selected: string[];
  filterTab: FilterTab;
  search: string;
  customDuration: ParsedDuration;
  customDurationInput: string;
  durationMs: number;
}

const DEFAULT_DURATION: ParsedDuration = { days: 0, hours: 0, minutes: 30 };

export class CardStore {
  private _state: CardStoreState = {
    selected: [],
    filterTab: 'all',
    search: '',
    customDuration: { ...DEFAULT_DURATION },
    customDurationInput: '30m',
    durationMs: 30 * TIME_MS.MINUTE,
  };

  getState(): CardStoreState {
    return {
      ...this._state,
      selected: [...this._state.selected],
      customDuration: { ...this._state.customDuration },
    };
  }

  setSelection(selected: string[]): void {
    this._state.selected = [...selected];
  }

  toggleSelection(entityId: string): void {
    if (this._state.selected.includes(entityId)) {
      this._state.selected = this._state.selected.filter((id) => id !== entityId);
      return;
    }
    this._state.selected = [...this._state.selected, entityId];
  }

  clearSelection(): void {
    this._state.selected = [];
  }

  setFilterTab(filterTab: FilterTab): void {
    this._state.filterTab = filterTab;
  }

  setSearch(search: string): void {
    this._state.search = search;
  }

  setDuration(customDuration: ParsedDuration, customDurationInput: string): void {
    this._state.customDuration = { ...customDuration };
    this._state.customDurationInput = customDurationInput;
    this._state.durationMs = durationToMinutes(customDuration) * TIME_MS.MINUTE;
  }
}

export function createCardStore(): CardStore {
  return new CardStore();
}
