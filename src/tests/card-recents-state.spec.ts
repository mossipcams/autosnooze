import { describe, expect, test, vi } from 'vitest';

vi.mock('../services/storage.js', () => ({
  saveLastDuration: vi.fn(),
  loadLastDuration: vi.fn().mockReturnValue(null),
  clearLastDuration: vi.fn(),
  saveRecentSnoozes: vi.fn(),
  loadRecentSnoozes: vi.fn().mockReturnValue(['automation.x']),
}));

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

import { AutomationPauseCard } from '../components/autosnooze-card.js';

describe('Card stores recent snooze IDs as state', () => {
  test('_recentSnoozeIds is set from loadRecentSnoozes', () => {
    if (!customElements.get('test-card-recents-state')) {
      customElements.define('test-card-recents-state', AutomationPauseCard);
    }
    const el = document.createElement('test-card-recents-state') as AutomationPauseCard & { _recentSnoozeIds: string[] };
    document.body.appendChild(el);

    expect(el._recentSnoozeIds).toEqual(['automation.x']);

    document.body.removeChild(el);
  });
});
