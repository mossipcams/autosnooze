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
import { loadRecentSnoozes } from '../services/storage.js';

describe('Card loads recent snooze IDs on connect', () => {
  test('calls loadRecentSnoozes in connectedCallback', () => {
    if (!customElements.get('test-card-recents')) {
      customElements.define('test-card-recents', AutomationPauseCard);
    }
    const el = document.createElement('test-card-recents') as AutomationPauseCard;
    document.body.appendChild(el);

    expect(loadRecentSnoozes).toHaveBeenCalled();

    document.body.removeChild(el);
  });
});
