import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('../services/storage.js', () => ({
  saveLastDuration: vi.fn(),
  loadLastDuration: vi.fn().mockReturnValue(null),
  saveRecentSnoozes: vi.fn(),
  loadRecentSnoozes: vi.fn().mockReturnValue(['automation.x']),
  loadHideSnoozedPreference: vi.fn().mockReturnValue(false),
  saveHideSnoozedPreference: vi.fn(),
}));

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

import { AutomationPauseCard } from '../components/autosnooze-card.js';
import { loadHideSnoozedPreference, loadRecentSnoozes } from '../services/storage.js';

type TestCard = HTMLElement & {
  _hideSnoozed: boolean;
};

describe('Card loads recent snooze IDs on connect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadRecentSnoozes).mockReturnValue(['automation.x']);
    vi.mocked(loadHideSnoozedPreference).mockReturnValue(false);
  });

  test('calls loadRecentSnoozes in connectedCallback', () => {
    if (!customElements.get('test-card-recents')) {
      customElements.define('test-card-recents', AutomationPauseCard);
    }
    const el = document.createElement('test-card-recents') as AutomationPauseCard;
    document.body.appendChild(el);

    expect(loadRecentSnoozes).toHaveBeenCalled();

    document.body.removeChild(el);
  });

  test('calls loadHideSnoozedPreference once in connectedCallback and sets _hideSnoozed state', () => {
    vi.mocked(loadHideSnoozedPreference).mockReturnValue(true);

    if (!customElements.get('test-card-hide-snoozed')) {
      customElements.define('test-card-hide-snoozed', AutomationPauseCard);
    }
    const el = document.createElement('test-card-hide-snoozed') as TestCard;
    document.body.appendChild(el);

    expect(loadHideSnoozedPreference).toHaveBeenCalledTimes(1);
    expect(el._hideSnoozed).toBe(true);

    document.body.removeChild(el);
  });
});
