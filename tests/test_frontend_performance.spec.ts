// @ts-nocheck: performance characterization intentionally probes component internals
import { afterEach, describe, expect, test, vi } from 'vitest';

import '../src/index.ts';

describe('frontend performance baseline', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  test('five_hundred_automation_fixture_has_bounded_rebuild_count', () => {
    const ListClass = customElements.get('autosnooze-automation-list');
    const list = new ListClass();
    const automations = Array.from({ length: 500 }, (_, index) => ({
      id: `automation.baseline_${index}`,
      name: `Baseline ${index}`,
      area_id: null,
      category_id: null,
      labels: [],
    }));
    const hass = createMockHass();
    list.automations = automations;
    list.hass = hass;

    const first = list._getViewModel();
    list.hass = { ...hass, states: { ...hass.states, 'sensor.unrelated': { state: 'changed', attributes: {} } } };
    const second = list._getViewModel();

    const rebuildCount = first === second ? 1 : 2;
    expect(rebuildCount).toBe(1);
  });

  test('records active-pause countdown update count', () => {
    const ActiveClass = customElements.get('autosnooze-active-pauses');
    const active = new ActiveClass();
    active.pauseGroups = [{
      resumeAt: new Date(Date.now() + 60_000).toISOString(),
      automations: [],
    }];
    const requestUpdate = vi.spyOn(active, 'requestUpdate');

    active._updateCountdownIfNeeded();

    expect(requestUpdate).toHaveBeenCalledTimes(1);
  });
});
