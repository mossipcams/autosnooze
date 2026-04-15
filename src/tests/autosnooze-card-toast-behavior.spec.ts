import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { HomeAssistant } from '../types/hass.js';

const {
  runPauseFeatureMock,
  runUndoFeatureMock,
  runWakeFeatureMock,
  runWakeAllFeatureMock,
  runAdjustFeatureMock,
  runCancelScheduledFeatureMock,
} = vi.hoisted(() => ({
  runPauseFeatureMock: vi.fn(),
  runUndoFeatureMock: vi.fn(),
  runWakeFeatureMock: vi.fn(),
  runWakeAllFeatureMock: vi.fn(),
  runAdjustFeatureMock: vi.fn(),
  runCancelScheduledFeatureMock: vi.fn(),
}));

vi.mock('../features/pause/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/pause/index.js')>();
  return {
    ...actual,
    runPauseFeature: runPauseFeatureMock,
  };
});

vi.mock('../features/resume/index.js', () => ({
  runUndoFeature: runUndoFeatureMock,
  runWakeFeature: runWakeFeatureMock,
  runWakeAllFeature: runWakeAllFeatureMock,
}));

vi.mock('../features/scheduled-snooze/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/scheduled-snooze/index.js')>();
  return {
    ...actual,
    runAdjustFeature: runAdjustFeatureMock,
    runCancelScheduledFeature: runCancelScheduledFeatureMock,
  };
});

import { AutomationPauseCard } from '../components/autosnooze-card.js';

type TestCard = HTMLElement & {
  hass?: HomeAssistant;
  _selected: string[];
  _scheduleMode: boolean;
  _resumeAtDate: string;
  _resumeAtTime: string;
  _adjustModalResumeAt: string;
  _guardrailConfirmOpen: boolean;
  _snooze: () => Promise<void>;
  _wake: (entityId: string) => Promise<void>;
  _handleWakeAllEvent: () => Promise<void>;
  _handleAdjustTimeEvent: (event: CustomEvent<{ entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number }>) => Promise<void>;
  _cancelScheduled: (entityId: string) => Promise<void>;
};

function createHass(): HomeAssistant {
  return {
    locale: {
      language: 'en',
    },
    states: {
      'automation.kitchen_lights': {
        entity_id: 'automation.kitchen_lights',
        state: 'on',
        attributes: {
          friendly_name: 'Kitchen Lights',
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
      'automation.kitchen_lights': {
        entity_id: 'automation.kitchen_lights',
        area_id: null,
        labels: [],
        categories: {},
      },
    },
    areas: {},
    connection: {
      sendMessagePromise: async <T>() => [] as T,
    },
    callService: async () => undefined,
  };
}

async function waitForLitElement(element: { updateComplete: Promise<boolean> }): Promise<void> {
  await element.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function createCard(): Promise<TestCard> {
  if (!customElements.get('test-autosnooze-card-toast')) {
    customElements.define('test-autosnooze-card-toast', AutomationPauseCard);
  }

  const card = document.createElement('test-autosnooze-card-toast') as TestCard;
  card.hass = createHass();
  Object.assign(card, {
    config: {
      type: 'custom:autosnooze-card',
      title: 'AutoSnooze',
    },
  });
  document.body.appendChild(card);
  await waitForLitElement(card as unknown as { updateComplete: Promise<boolean> });
  return card;
}

describe('AutomationPauseCard toast behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    runPauseFeatureMock.mockReset();
    runUndoFeatureMock.mockReset();
    runWakeFeatureMock.mockReset();
    runWakeAllFeatureMock.mockReset();
    runAdjustFeatureMock.mockReset();
    runCancelScheduledFeatureMock.mockReset();
  });

  test('keeps local validation toasts for incomplete scheduled snoozes', async () => {
    const card = await createCard();
    card._selected = ['automation.kitchen_lights'];
    card._scheduleMode = true;
    card._resumeAtDate = '';
    card._resumeAtTime = '';

    await card._snooze();

    const toast = card.shadowRoot?.querySelector('.toast');
    expect(toast?.textContent).toContain('Please set a complete resume date and time');
  });

  test('does not render a card toast when snooze service calls fail', async () => {
    const card = await createCard();
    card._selected = ['automation.kitchen_lights'];
    runPauseFeatureMock.mockRejectedValue(new Error('pause failed'));

    await card._snooze();

    expect(card.shadowRoot?.querySelector('.toast')).toBeNull();
  });

  test('does not render a card toast when wake service calls fail', async () => {
    const card = await createCard();
    runWakeFeatureMock.mockRejectedValue(new Error('wake failed'));

    await card._wake('automation.kitchen_lights');

    expect(card.shadowRoot?.querySelector('.toast')).toBeNull();
  });

  test('does not render a card toast when wake-all service calls fail', async () => {
    const card = await createCard();
    runWakeAllFeatureMock.mockRejectedValue(new Error('wake all failed'));

    await card._handleWakeAllEvent();

    expect(card.shadowRoot?.querySelector('.toast')).toBeNull();
  });

  test('does not render a card toast when adjust service calls fail', async () => {
    const card = await createCard();
    card._adjustModalResumeAt = '2026-04-13T02:00:00.000Z';
    runAdjustFeatureMock.mockRejectedValue(new Error('adjust failed'));

    await card._handleAdjustTimeEvent(new CustomEvent('adjust-time', {
      detail: { entityId: 'automation.kitchen_lights', minutes: 5 },
    }));

    expect(card.shadowRoot?.querySelector('.toast')).toBeNull();
  });

  test('does not render a card toast when cancel scheduled service calls fail', async () => {
    const card = await createCard();
    runCancelScheduledFeatureMock.mockRejectedValue(new Error('cancel failed'));

    await card._cancelScheduled('automation.kitchen_lights');

    expect(card.shadowRoot?.querySelector('.toast')).toBeNull();
  });

  test('keeps undo failure toasts in the card', async () => {
    const card = await createCard();
    card._selected = ['automation.kitchen_lights'];
    runPauseFeatureMock.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Snoozed 1 automation for 30m',
    });
    runUndoFeatureMock.mockRejectedValue(new Error('undo failed'));

    await card._snooze();

    const undoButton = card.shadowRoot?.querySelector('.toast-undo-btn');
    expect(undoButton).not.toBeNull();

    (undoButton as HTMLButtonElement).click();
    await waitForLitElement(card as unknown as { updateComplete: Promise<boolean> });

    const toast = card.shadowRoot?.querySelector('.toast');
    expect(toast?.textContent).toContain('Failed to undo');
  });

  test('keeps backend confirm-required fallback toast-free while opening the guardrail', async () => {
    const card = await createCard();
    card._selected = ['automation.kitchen_lights'];
    runPauseFeatureMock.mockResolvedValue({
      status: 'confirm_required',
    });

    await card._snooze();

    expect(card._guardrailConfirmOpen).toBe(true);
    expect(card.shadowRoot?.querySelector('.toast')).toBeNull();
  });
});
