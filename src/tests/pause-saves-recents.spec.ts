import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../services/snooze.js', () => ({
  pauseAutomations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/storage.js', () => ({
  saveLastDuration: vi.fn(),
  loadLastDuration: vi.fn().mockReturnValue(null),
  clearLastDuration: vi.fn(),
  saveRecentSnoozes: vi.fn(),
  loadRecentSnoozes: vi.fn().mockReturnValue([]),
}));

import { runPauseActionFeature, runPauseFeature } from '../features/pause/index.js';
import { saveRecentSnoozes } from '../services/storage.js';
import { pauseAutomations } from '../services/snooze.js';

describe('runPauseFeature saves recent snoozes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls saveRecentSnoozes with selected entity IDs on successful pause', async () => {
    const hass = { callService: vi.fn(), language: 'en' } as unknown as Parameters<typeof runPauseFeature>[0]['hass'];
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a', 'automation.b'],
      scheduleMode: false,
      customDuration: { days: 0, hours: 1, minutes: 0 },
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '',
      resumeAtTime: '',
    });

    expect(result.status).toBe('submitted');
    expect(saveRecentSnoozes).toHaveBeenCalledWith(['automation.a', 'automation.b']);
  });

  test('runPauseActionFeature delegates pause requests through the service seam', async () => {
    const hass = { callService: vi.fn(), language: 'en' } as unknown as Parameters<typeof runPauseFeature>[0]['hass'];
    const params = { entity_id: ['automation.a'], hours: 1 };

    await runPauseActionFeature(hass, params);

    expect(pauseAutomations).toHaveBeenCalledWith(hass, params);
  });
});
