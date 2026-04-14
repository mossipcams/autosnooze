import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { HomeAssistant } from '../types/hass.js';

const { runPauseFeatureMock } = vi.hoisted(() => ({
  runPauseFeatureMock: vi.fn(),
}));

vi.mock('../features/pause/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/pause/index.js')>();
  return {
    ...actual,
    runPauseFeature: runPauseFeatureMock,
  };
});

import { AutomationPauseCard } from '../components/autosnooze-card.js';

type TestCard = {
  hass?: HomeAssistant;
  _selected: string[];
  _labelRegistry: Record<string, { label_id: string; name: string }>;
  _guardrailConfirmOpen: boolean;
  _snooze: () => Promise<void>;
};

function createHass(): HomeAssistant {
  return {
    states: {
      'automation.front_door_security': {
        entity_id: 'automation.front_door_security',
        state: 'on',
        attributes: {
          friendly_name: 'Front Door Security',
        },
        last_changed: '2026-04-13T00:00:00.000Z',
        last_updated: '2026-04-13T00:00:00.000Z',
        context: {
          id: 'ctx',
          parent_id: null,
          user_id: null,
        },
      },
    },
    entities: {
      'automation.front_door_security': {
        entity_id: 'automation.front_door_security',
        area_id: null,
        labels: [],
        categories: {},
      },
    },
    areas: {},
    connection: {
      sendMessagePromise: async <T>() => [] as T,
    },
    locale: {
      language: 'en',
    },
    callService: async () => undefined,
  };
}

describe('AutomationPauseCard guardrail precheck', () => {
  beforeEach(() => {
    runPauseFeatureMock.mockReset();
    runPauseFeatureMock.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Snoozed 1 automation for 30m',
    });
  });

  test('opens the local guardrail before calling the backend for critical automations', async () => {
    if (!customElements.get('test-autosnooze-card-guardrail')) {
      customElements.define('test-autosnooze-card-guardrail', AutomationPauseCard);
    }

    const element = document.createElement('test-autosnooze-card-guardrail') as unknown as TestCard;
    element.hass = createHass();
    element._selected = ['automation.front_door_security'];

    await element._snooze();

    expect(runPauseFeatureMock).not.toHaveBeenCalled();
    expect(element._guardrailConfirmOpen).toBe(true);
  });
});
