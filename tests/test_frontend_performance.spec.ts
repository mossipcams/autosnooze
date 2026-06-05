import { afterEach, describe, expect, test, vi } from 'vitest';

import { AutoSnoozeActivePauses } from '../src/components/autosnooze-active-pauses.js';
import { AutoSnoozeAutomationList } from '../src/components/autosnooze-automation-list.js';
import '../src/index.js';

describe('frontend performance baseline', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  test('five_hundred_automation_fixture_has_bounded_rebuild_count', async () => {
    const list = new AutoSnoozeAutomationList();
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
    document.body.append(list);
    await list.updateComplete;
    const firstMarkup = list.shadowRoot?.innerHTML;
    const render = vi.spyOn(list, 'render');

    list.hass = {
      ...hass,
      states: {
        ...hass.states,
        'sensor.unrelated': {
          entity_id: 'sensor.unrelated',
          state: 'changed',
          attributes: {},
          last_changed: '2030-01-01T00:00:00Z',
          last_updated: '2030-01-01T00:00:00Z',
          context: { id: 'performance-test', parent_id: null, user_id: null },
        },
      },
    };
    await list.updateComplete;

    expect(render).toHaveBeenCalledTimes(1);
    expect(list.shadowRoot?.innerHTML).toBe(firstMarkup);
  });

  test('countdown_tick_does_not_rerender_unrelated_card_sections', async () => {
    const active = new AutoSnoozeActivePauses();
    active.pauseGroups = [{
      resumeAt: new Date(Date.now() + 60_000).toISOString(),
      automations: [],
    }];
    active.pausedCount = 1;
    document.body.append(active);
    await active.updateComplete;
    const requestUpdate = vi.spyOn(active, 'requestUpdate');

    vi.useFakeTimers();
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(requestUpdate).not.toHaveBeenCalled();
    expect(active.shadowRoot.querySelector('.countdown')?.textContent).toBeTruthy();
  });
});
