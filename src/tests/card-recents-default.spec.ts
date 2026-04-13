import { describe, expect, test, vi } from 'vitest';

vi.mock('../services/storage.js', () => ({
  saveLastDuration: vi.fn(),
  loadLastDuration: vi.fn().mockReturnValue(null),
  clearLastDuration: vi.fn(),
  saveRecentSnoozes: vi.fn(),
  loadRecentSnoozes: vi.fn().mockReturnValue([]),
}));

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

import { AutomationPauseCard } from '../components/autosnooze-card.js';

describe('Card _recentSnoozeIds has default value', () => {
  test('_recentSnoozeIds defaults to empty array before connectedCallback', () => {
    if (!customElements.get('test-card-recents-default')) {
      customElements.define('test-card-recents-default', AutomationPauseCard);
    }
    const el = document.createElement('test-card-recents-default') as AutomationPauseCard & { _recentSnoozeIds: string[] };
    // Before connecting to DOM, property should already be an empty array
    expect(el._recentSnoozeIds).toEqual([]);
  });
});
