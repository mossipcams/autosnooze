import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { HomeAssistant } from '../types/hass.js';

const mocks = vi.hoisted(() => ({
  hapticFeedback: vi.fn(),
  runPauseFeature: vi.fn(),
  runUndoFeature: vi.fn(),
  runWakeFeature: vi.fn(),
  runWakeAllFeature: vi.fn(),
  runClearNotificationFeature: vi.fn(),
  runAdjustFeature: vi.fn(),
  runCancelScheduledFeature: vi.fn(),
}));

vi.mock('../utils/haptic.js', () => ({ hapticFeedback: mocks.hapticFeedback }));
vi.mock('../features/pause/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/pause/index.js')>();
  return { ...actual, runPauseFeature: mocks.runPauseFeature };
});
vi.mock('../features/resume/index.js', () => ({
  runUndoFeature: mocks.runUndoFeature,
  runWakeFeature: mocks.runWakeFeature,
  runWakeAllFeature: mocks.runWakeAllFeature,
  runClearNotificationFeature: mocks.runClearNotificationFeature,
}));
vi.mock('../features/scheduled-snooze/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/scheduled-snooze/index.js')>();
  return {
    ...actual,
    runAdjustFeature: mocks.runAdjustFeature,
    runCancelScheduledFeature: mocks.runCancelScheduledFeature,
  };
});

const cardModule = await import('../components/autosnooze-card.js');

if (!customElements.get('autosnooze-card-until-tomorrow')) {
  customElements.define('autosnooze-card-until-tomorrow', cardModule.AutomationPauseCard);
}

const SENSOR_ID = 'sensor.autosnooze_snoozed_automations';

type TestCard = HTMLElement & {
  hass: HomeAssistant;
  config: { type: string; title: string };
  updateComplete: Promise<boolean>;
  _selected: string[];
  _customDurationInput: string;
  _untilTomorrow: boolean;
  _showCustomInput: boolean;
  _snooze: (forceConfirm?: boolean) => Promise<void>;
  _handleUntilTomorrowSelect: () => void;
};

function createHass(): HomeAssistant {
  return {
    locale: { language: 'en-US' },
    states: {
      [SENSOR_ID]: {
        entity_id: SENSOR_ID,
        state: '0',
        attributes: { schema_version: 1, paused: {}, scheduled: {} },
      },
      'automation.kitchen_lights': {
        entity_id: 'automation.kitchen_lights',
        state: 'on',
        attributes: { friendly_name: 'Kitchen Lights' },
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
      sendMessagePromise: async <T>(message: { type: string }) => {
        if (message.type === 'config/label_registry/list') return [] as T;
        if (message.type === 'config/category_registry/list') return [] as T;
        if (message.type === 'config/entity_registry/list') return [] as T;
        return [] as T;
      },
    },
    callService: async () => undefined,
  } as unknown as HomeAssistant;
}

function createCard(setup: (card: TestCard) => void = () => {}): TestCard {
  const card = document.createElement('autosnooze-card-until-tomorrow') as TestCard;
  card.hass = createHass();
  card.config = { type: 'custom:autosnooze-card', title: 'AutoSnooze' };
  setup(card);
  return card;
}

async function connectCard(setup: (card: TestCard) => void = () => {}): Promise<TestCard> {
  const card = createCard(setup);
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

describe('AutomationPauseCard until tomorrow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('snoozing with until-tomorrow calls pause service with tomorrow 08:00 local resume_at', async () => {
    const card = await connectCard((el) => {
      el._selected = ['automation.kitchen_lights'];
    });
    mocks.runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Snoozed 1 automation until Apr 30, 8:00 AM',
    });

    card._handleUntilTomorrowSelect();
    await card.updateComplete;
    await card._snooze();

    expect(mocks.runPauseFeature).toHaveBeenCalledWith(expect.objectContaining({
      scheduleMode: false,
      untilTomorrow: true,
      resumeAtDate: '',
      resumeAtTime: '',
      disableAtDate: '',
      disableAtTime: '',
    }));
    expect(card._untilTomorrow).toBe(false);
  });

  test('snooze button stays enabled with invalid custom input while until-tomorrow is selected', async () => {
    const card = await connectCard((el) => {
      el._selected = ['automation.kitchen_lights'];
      el._customDurationInput = 'not valid';
      el._showCustomInput = true;
    });

    card._handleUntilTomorrowSelect();
    await card.updateComplete;

    const snoozeButton = card.shadowRoot?.querySelector<HTMLButtonElement>('.snooze-btn');
    expect(snoozeButton?.disabled).toBe(false);
  });
});
