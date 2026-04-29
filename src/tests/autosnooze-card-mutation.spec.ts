import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { HomeAssistant } from '../types/hass.js';
import type { ParsedDuration } from '../types/automation.js';

const mocks = vi.hoisted(() => ({
  hapticFeedback: vi.fn(),
  runPauseFeature: vi.fn(),
  runUndoFeature: vi.fn(),
  runWakeFeature: vi.fn(),
  runWakeAllFeature: vi.fn(),
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

if (!customElements.get('autosnooze-card-mutation')) {
  customElements.define('autosnooze-card-mutation', cardModule.AutomationPauseCard);
}

const SENSOR_ID = 'sensor.autosnooze_snoozed_automations';

type TestCard = HTMLElement & {
  hass: HomeAssistant;
  config: { type: string; title: string };
  updateComplete: Promise<boolean>;
  _selected: string[];
  _duration: number;
  _customDuration: ParsedDuration;
  _customDurationInput: string;
  _loading: boolean;
  _scheduleMode: boolean;
  _disableAtDate: string;
  _disableAtTime: string;
  _resumeAtDate: string;
  _resumeAtTime: string;
  _labelRegistry: Record<string, unknown>;
  _labelRegistryUnavailable: boolean;
  _categoryRegistry: Record<string, unknown>;
  _entityRegistry: Record<string, unknown>;
  _showCustomInput: boolean;
  _automationsCacheVersion: number;
  _lastDuration: { minutes: number; duration: ParsedDuration; timestamp: number } | null;
  _recentSnoozeIds: string[];
  _adjustModalOpen: boolean;
  _adjustModalEntityId: string;
  _adjustModalFriendlyName: string;
  _adjustModalResumeAt: string;
  _adjustModalEntityIds: string[];
  _adjustModalFriendlyNames: string[];
  _guardrailConfirmOpen: boolean;
  _labelsFetched: boolean;
  _categoriesFetched: boolean;
  _entityRegistryFetched: boolean;
  _labelRegistryFetchPromise: Promise<void> | null;
  _categoryRegistryFetchPromise: Promise<void> | null;
  _entityRegistryFetchPromise: Promise<void> | null;
  _labelRegistryRetryTimeout: number | null;
  _labelRegistryRetryDelayMs: number;
  _toastTimeout: number | null;
  _toastFadeTimeout: number | null;
  shouldUpdate: (changedProps: Map<string, unknown>) => boolean;
  updated: (changedProps: Map<string, unknown>) => void;
  disconnectedCallback: () => void;
  _syncAdjustModalWithPausedState: () => void;
  _getAutomations: () => unknown[];
  _getPaused: () => Record<string, unknown>;
  _getScheduled: () => Record<string, unknown>;
  _getPausedGroupedByResumeTime: () => unknown[];
  _getPausedSnapshot: () => { paused: Record<string, unknown>; scheduled: Record<string, unknown>; groups: unknown[] };
  _isSnoozeSensorAvailable: () => boolean;
  _formatDateTime: (value: string) => string;
  _getLocale: () => string | undefined;
  _hasResumeAt: () => boolean;
  _hasDisableAt: () => boolean;
  _showToast: (message: string, options?: { showUndo?: boolean; onUndo?: (() => void) | null }) => void;
  _snooze: (forceConfirm?: boolean) => Promise<void>;
  _wake: (entityId: string) => Promise<void>;
  _handleWakeEvent: (event: CustomEvent<{ entityId: string }>) => Promise<void>;
  _handleWakeAllEvent: () => Promise<void>;
  _handleAdjustAutomationEvent: (event: CustomEvent<{ entityId: string; friendlyName: string; resumeAt: string }>) => void;
  _handleAdjustGroupEvent: (event: CustomEvent<{ entityIds: string[]; friendlyNames: string[]; resumeAt: string }>) => void;
  _handleAdjustTimeEvent: (event: CustomEvent<{ entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number }>) => Promise<void>;
  _handleCloseModalEvent: () => void;
  _cancelScheduled: (entityId: string) => Promise<void>;
  _setSelected: (selected: string[]) => void;
  _setDurationState: (duration: ParsedDuration, input: string) => void;
  _handleDurationChange: (event: CustomEvent<{ minutes: number; duration: ParsedDuration; input: string; showCustomInput?: boolean }>) => void;
  _handleScheduleModeChange: (event: CustomEvent<{ enabled: boolean }>) => void;
  _handleScheduleFieldChange: (event: CustomEvent<{ field: string; value: string }>) => void;
  _handleCustomInputToggle: (event: CustomEvent<{ show: boolean }>) => void;
  _handleSelectionChange: (event: CustomEvent<{ selected: string[] }>) => void;
  _handleGuardrailCancel: () => void;
  _handleGuardrailContinue: () => Promise<void>;
  _fetchLabelRegistry: () => Promise<void>;
  _fetchCategoryRegistry: () => Promise<void>;
  _fetchEntityRegistry: () => Promise<void>;
  _haveAutomationStatesChanged: (oldStates: Record<string, unknown>, newStates: Record<string, unknown>) => boolean;
  _getAutomationStateFingerprint: (states: Record<string, unknown>) => string;
};

function createHass(options: {
  sensor?: boolean;
  paused?: Record<string, unknown>;
  scheduled?: Record<string, unknown>;
  connection?: HomeAssistant['connection'];
  language?: string;
  statesOverride?: Record<string, unknown>;
} = {}): HomeAssistant {
  const states: Record<string, unknown> = options.statesOverride ?? {
    'automation.kitchen_lights': {
      entity_id: 'automation.kitchen_lights',
      state: 'on',
      attributes: { friendly_name: 'Kitchen Lights' },
      last_changed: '2026-04-29T10:00:00.000Z',
      last_updated: '2026-04-29T10:00:00.000Z',
    },
    'automation.office_fan': {
      entity_id: 'automation.office_fan',
      state: 'off',
      attributes: { friendly_name: 'Office Fan' },
      last_changed: '2026-04-29T10:05:00.000Z',
      last_updated: '2026-04-29T10:05:00.000Z',
    },
    'light.kitchen': {
      entity_id: 'light.kitchen',
      state: 'on',
      attributes: {},
    },
  };

  if (options.sensor !== false) {
    states[SENSOR_ID] = {
      entity_id: SENSOR_ID,
      state: String(Object.keys(options.paused ?? {}).length),
      attributes: {
        schema_version: 1,
        paused: options.paused ?? {},
        scheduled: options.scheduled ?? {},
      },
    };
  }

  return {
    language: options.language,
    locale: { language: options.language ?? 'en-US' },
    states,
    entities: {
      'automation.kitchen_lights': {
        entity_id: 'automation.kitchen_lights',
        area_id: 'kitchen',
        labels: ['evening'],
        categories: {},
      },
      'automation.office_fan': {
        entity_id: 'automation.office_fan',
        area_id: 'office',
        labels: [],
        categories: {},
      },
    },
    areas: {
      kitchen: { name: 'Kitchen' },
      office: { name: 'Office' },
    },
    connection: options.connection ?? {
      sendMessagePromise: async <T>(message: { type: string }) => {
        if (message.type === 'config/label_registry/list') {
          return [{ label_id: 'evening', name: 'Evening' }] as T;
        }
        if (message.type === 'config/category_registry/list') {
          return [{ category_id: 'lighting', name: 'Lighting' }] as T;
        }
        if (message.type === 'config/entity_registry/list') {
          return [
            { entity_id: 'automation.kitchen_lights', category_id: 'lighting' },
            { entity_id: 'light.kitchen', category_id: 'ignored' },
          ] as T;
        }
        return [] as T;
      },
    },
    callService: async () => undefined,
  } as unknown as HomeAssistant;
}

function createCard(setup: (card: TestCard) => void = () => {}): TestCard {
  const card = document.createElement('autosnooze-card-mutation') as TestCard;
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

function getText(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('AutomationPauseCard mutation boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('keeps static metadata, styles, and empty render gates exact', async () => {
    expect(Array.isArray(cardModule.AutomationPauseCard.styles)).toBe(true);
    expect(cardModule.AutomationPauseCard.styles).toHaveLength(2);
    expect(cardModule.AutomationPauseCard.getStubConfig()).toEqual({
      type: 'custom:autosnooze-card',
      title: 'AutoSnooze',
    });
    expect(cardModule.AutomationPauseCard.getConfigElement().tagName.toLowerCase()).toBe('autosnooze-card-editor');

    const card = document.createElement('autosnooze-card-mutation') as TestCard;
    document.body.appendChild(card);
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector('ha-card')).toBeNull();
  });

  test('shouldUpdate distinguishes hass, registry, language, and automation state changes', () => {
    const card = createCard();
    const sameStates = createHass();
    const sameStatesNext = { ...sameStates, states: sameStates.states };

    expect(card.shouldUpdate(new Map([['config', undefined]]) as never)).toBe(true);
    expect(card.shouldUpdate(new Map([['hass', undefined]]) as never)).toBe(true);

    card.hass = sameStatesNext;
    expect(card.shouldUpdate(new Map([['hass', sameStates]]) as never)).toBe(false);

    card.hass = createHass({ language: 'fr' });
    expect(card.shouldUpdate(new Map([['hass', sameStates]]) as never)).toBe(true);

    const sensorChanged = createHass();
    sensorChanged.states[SENSOR_ID] = { ...(sensorChanged.states[SENSOR_ID] as object), state: 'changed' } as never;
    card.hass = sensorChanged;
    expect(card.shouldUpdate(new Map([['hass', sameStates]]) as never)).toBe(true);

    card.hass = { ...sameStates, entities: {} } as HomeAssistant;
    expect(card.shouldUpdate(new Map([['hass', sameStates]]) as never)).toBe(true);

    card.hass = { ...sameStates, areas: {} } as HomeAssistant;
    expect(card.shouldUpdate(new Map([['hass', sameStates]]) as never)).toBe(true);

    card.hass = { ...sameStates, states: undefined as never };
    expect(card.shouldUpdate(new Map([['hass', sameStates]]) as never)).toBe(true);

    const nonAutomationOnly = { ...sameStates.states, 'light.kitchen': { state: 'off' } };
    expect(card._haveAutomationStatesChanged(sameStates.states as never, nonAutomationOnly)).toBe(false);
    expect(card._haveAutomationStatesChanged(sameStates.states as never, {
      ...sameStates.states,
      'automation.new': { state: 'on' },
    })).toBe(true);
    expect(card._haveAutomationStatesChanged(sameStates.states as never, {
      ...sameStates.states,
      'automation.kitchen_lights': { state: 'off' },
    })).toBe(true);
  });

  test('automation fingerprint and cache reuse only stable state references and cache versions', () => {
    const card = createCard();
    const states = card.hass!.states as never as Record<string, unknown>;

    const firstFingerprint = card._getAutomationStateFingerprint(states);
    expect(card._getAutomationStateFingerprint(states)).toBe(firstFingerprint);
    expect(firstFingerprint).toContain('automation.kitchen_lights:on');
    expect(firstFingerprint).not.toContain('light.kitchen');

    const firstAutomations = card._getAutomations();
    expect(card._getAutomations()).toBe(firstAutomations);
    card._automationsCacheVersion += 1;
    expect(card._getAutomations()).not.toBe(firstAutomations);

    card.hass = { ...createHass(), states: undefined as never };
    expect(card._getAutomations()).toEqual([]);
  });

  test('fetches registries, filters entity registry, and handles label retry backoff', async () => {
    const messages: Array<{ type: string; scope?: string }> = [];
    const card = createCard((el) => {
      el.hass = createHass({
        connection: {
          sendMessagePromise: async <T>(message: { type: string; scope?: string }) => {
            messages.push(message);
            if (message.type === 'config/label_registry/list') {
              return [{ label_id: 'evening', name: 'Evening' }] as T;
            }
            if (message.type === 'config/category_registry/list') {
              return [{ category_id: 'lighting', name: 'Lighting' }] as T;
            }
            return [
              { entity_id: 'automation.kitchen_lights', category_id: 'lighting' },
              { entity_id: 'light.kitchen', category_id: 'ignored' },
            ] as T;
          },
        } as HomeAssistant['connection'],
      });
    });

    await card._fetchLabelRegistry();
    await card._fetchCategoryRegistry();
    await card._fetchEntityRegistry();

    expect(messages).toEqual([
      { type: 'config/label_registry/list' },
      { type: 'config/category_registry/list', scope: 'automation' },
      { type: 'config/entity_registry/list' },
    ]);
    expect(card._labelRegistry).toEqual({ evening: { label_id: 'evening', name: 'Evening' } });
    expect(card._categoryRegistry).toEqual({ lighting: { category_id: 'lighting', name: 'Lighting' } });
    expect(card._entityRegistry).toEqual({
      'automation.kitchen_lights': { entity_id: 'automation.kitchen_lights', category_id: 'lighting' },
    });
    expect(card._labelsFetched).toBe(true);
    expect(card._categoriesFetched).toBe(true);
    expect(card._entityRegistryFetched).toBe(true);

    const failing = createCard((el) => {
      el.hass = createHass({
        connection: {
          sendMessagePromise: vi.fn(async () => {
            throw new Error('offline');
          }),
        } as unknown as HomeAssistant['connection'],
      });
    });
    document.body.appendChild(failing);
    await failing._fetchLabelRegistry();
    expect(failing._labelsFetched).toBe(false);
    expect(failing._labelRegistryUnavailable).toBe(true);
    expect(failing._labelRegistryRetryTimeout).not.toBeNull();
    expect(failing._labelRegistryRetryDelayMs).toBe(2_000);
    vi.runOnlyPendingTimers();
    expect(failing._labelRegistryRetryTimeout).toBeNull();
  });

  test('lifecycle hooks gate registry fetches and clear pending timers exactly', async () => {
    const card = createCard();
    const labelSpy = vi.spyOn(card, '_fetchLabelRegistry').mockResolvedValue(undefined);
    const categorySpy = vi.spyOn(card, '_fetchCategoryRegistry').mockResolvedValue(undefined);
    const entitySpy = vi.spyOn(card, '_fetchEntityRegistry').mockResolvedValue(undefined);

    card.updated(new Map([['hass', undefined]]));
    expect(labelSpy).toHaveBeenCalledTimes(1);
    expect(categorySpy).toHaveBeenCalledTimes(1);
    expect(entitySpy).toHaveBeenCalledTimes(1);

    labelSpy.mockClear();
    categorySpy.mockClear();
    entitySpy.mockClear();
    card._labelsFetched = false;
    card._labelRegistryRetryTimeout = window.setTimeout(() => undefined, 1000);
    card._categoriesFetched = true;
    card._entityRegistryFetched = true;
    card.updated(new Map([['hass', undefined]]));
    expect(labelSpy).not.toHaveBeenCalled();
    expect(categorySpy).not.toHaveBeenCalled();
    expect(entitySpy).not.toHaveBeenCalled();

    card._toastTimeout = window.setTimeout(() => undefined, 1000);
    card._toastFadeTimeout = window.setTimeout(() => undefined, 1000);
    card.disconnectedCallback();
    expect(card._toastTimeout).toBeNull();
    expect(card._toastFadeTimeout).toBeNull();
    expect(card._labelRegistryRetryTimeout).toBeNull();
  });

  test('registry fetches await in-flight work and skip when already fetched or disconnected', async () => {
    const card = createCard();
    const pendingLabel = Promise.resolve();
    const pendingCategory = Promise.resolve();
    const pendingEntity = Promise.resolve();

    card._labelRegistryFetchPromise = pendingLabel;
    await card._fetchLabelRegistry();
    expect(card._labelRegistryFetchPromise).toBe(pendingLabel);

    card._categoryRegistryFetchPromise = pendingCategory;
    await card._fetchCategoryRegistry();
    expect(card._categoryRegistryFetchPromise).toBe(pendingCategory);

    card._entityRegistryFetchPromise = pendingEntity;
    await card._fetchEntityRegistry();
    expect(card._entityRegistryFetchPromise).toBe(pendingEntity);

    const noConnection = createCard((el) => {
      el.hass = { ...createHass(), connection: undefined as never };
    });
    await noConnection._fetchLabelRegistry();
    await noConnection._fetchCategoryRegistry();
    await noConnection._fetchEntityRegistry();
    expect(noConnection._labelsFetched).toBe(false);
    expect(noConnection._categoriesFetched).toBe(false);
    expect(noConnection._entityRegistryFetched).toBe(false);

    card._labelsFetched = true;
    card._categoriesFetched = true;
    card._entityRegistryFetched = true;
    card._labelRegistryFetchPromise = null;
    card._categoryRegistryFetchPromise = null;
    card._entityRegistryFetchPromise = null;
    await card._fetchLabelRegistry();
    await card._fetchCategoryRegistry();
    await card._fetchEntityRegistry();
    expect(card._labelRegistryFetchPromise).toBeNull();
    expect(card._categoryRegistryFetchPromise).toBeNull();
    expect(card._entityRegistryFetchPromise).toBeNull();
  });

  test('adjust modal sync updates live targets and closes when paused targets disappear', () => {
    const card = createCard((el) => {
      el.hass = createHass({
        paused: {
          'automation.kitchen_lights': {
            friendly_name: 'Kitchen Lights',
            resume_at: '2026-04-29T13:00:00',
          },
          'automation.office_fan': {
            friendly_name: 'Office Fan',
            resume_at: '2026-04-29T14:00:00',
          },
        },
      });
      el._adjustModalOpen = true;
      el._adjustModalEntityIds = ['automation.kitchen_lights', 'automation.office_fan'];
      el._adjustModalFriendlyNames = ['Kitchen Lights', 'Office Fan'];
      el._adjustModalResumeAt = '2026-04-29T12:30:00';
    });

    card._syncAdjustModalWithPausedState();
    expect(card._adjustModalOpen).toBe(true);
    expect(card._adjustModalResumeAt).toBe('2026-04-29T13:00:00');

    card.hass = createHass({
      paused: {
        'automation.office_fan': {
          friendly_name: 'Office Fan',
          resume_at: '2026-04-29T14:30:00',
        },
      },
    });
    card._syncAdjustModalWithPausedState();
    expect(card._adjustModalOpen).toBe(true);
    expect(card._adjustModalResumeAt).toBe('2026-04-29T14:30:00');

    card.hass = createHass({ paused: {} });
    card._syncAdjustModalWithPausedState();
    expect(card._adjustModalOpen).toBe(false);
    expect(card._adjustModalEntityIds).toEqual([]);

    card._adjustModalOpen = true;
    card._adjustModalEntityId = 'automation.kitchen_lights';
    card._adjustModalEntityIds = [];
    card._adjustModalResumeAt = '2026-04-29T12:00:00';
    card.hass = createHass({
      paused: {
        'automation.kitchen_lights': {
          friendly_name: 'Kitchen Lights',
          resume_at: '2026-04-29T15:00:00',
        },
      },
    });
    card._syncAdjustModalWithPausedState();
    expect(card._adjustModalOpen).toBe(true);
    expect(card._adjustModalResumeAt).toBe('2026-04-29T15:00:00');

    card.hass = createHass({ paused: {} });
    card._syncAdjustModalWithPausedState();
    expect(card._adjustModalOpen).toBe(false);
  });

  test('toast lifecycle replaces existing toasts, wires undo, and clears fade timers', async () => {
    const card = await connectCard();
    const undo = vi.fn();

    card._showToast('First toast');
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toBe('First toast');
    card._showToast('Second toast', { showUndo: true, onUndo: undo });

    const toast = card.shadowRoot?.querySelector('.toast');
    expect(toast?.getAttribute('role')).toBe('alert');
    expect(toast?.getAttribute('aria-live')).toBe('polite');
    expect(getText(toast)).toBe('Second toastUndo');
    expect(card.shadowRoot?.querySelector('.toast-undo-btn')?.getAttribute('aria-label')).toBe('Undo last action');

    card.shadowRoot?.querySelector<HTMLButtonElement>('.toast-undo-btn')?.click();
    expect(undo).toHaveBeenCalledTimes(1);
    expect(card.shadowRoot?.querySelector('.toast')).toBeNull();

    card._showToast('Plain undo ignored', { showUndo: true });
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toBe('Plain undo ignored');

    card._showToast('Timed toast');
    vi.advanceTimersByTime(5_000);
    expect(card._toastTimeout).toBeNull();
    expect(card._toastFadeTimeout).not.toBeNull();
    vi.advanceTimersByTime(300);
    expect(card._toastFadeTimeout).toBeNull();
    expect(card.shadowRoot?.querySelector('.toast')).toBeNull();

    const detached = createCard();
    detached._showToast('No root');
    expect(detached._toastTimeout).toBeNull();
  });

  test('state event handlers update duration, schedule, selection, guardrail, and modal state', async () => {
    const card = createCard((el) => {
      el._lastDuration = { minutes: 45, duration: { days: 0, hours: 0, minutes: 45 }, timestamp: Date.now() };
    });

    card._handleDurationChange(new CustomEvent('duration-change', {
      detail: {
        minutes: 150,
        duration: { days: 0, hours: 2, minutes: 30 },
        input: '2h30m',
        showCustomInput: true,
      },
    }));
    expect(card._duration).toBe(150 * 60 * 1000);
    expect(card._customDuration).toEqual({ days: 0, hours: 2, minutes: 30 });
    expect(card._customDurationInput).toBe('2h30m');
    expect(card._showCustomInput).toBe(true);

    card._handleScheduleModeChange(new CustomEvent('schedule-mode-change', { detail: { enabled: true } }));
    expect(card._scheduleMode).toBe(true);
    expect(card._disableAtDate).toBe('2026-04-29');
    expect(card._disableAtTime).toBe('12:00');
    expect(card._resumeAtDate).toBe('2026-04-29');
    expect(card._resumeAtTime).toBe('12:45');
    expect(card._hasResumeAt()).toBe(true);
    expect(card._hasDisableAt()).toBe(true);

    card._handleScheduleFieldChange(new CustomEvent('schedule-field-change', {
      detail: { field: 'resumeAtTime', value: '13:15' },
    }));
    expect(card._resumeAtTime).toBe('13:15');
    card._handleScheduleFieldChange(new CustomEvent('schedule-field-change', {
      detail: { field: 'unknown', value: 'ignored' },
    }));
    expect(card._resumeAtTime).toBe('13:15');

    card._handleScheduleModeChange(new CustomEvent('schedule-mode-change', { detail: { enabled: false } }));
    expect(card._scheduleMode).toBe(false);
    expect(card._resumeAtTime).toBe('13:15');

    card._handleCustomInputToggle(new CustomEvent('custom-input-toggle', { detail: { show: false } }));
    expect(card._showCustomInput).toBe(false);
    card._handleSelectionChange(new CustomEvent('selection-change', { detail: { selected: ['automation.office_fan'] } }));
    expect(card._selected).toEqual(['automation.office_fan']);

    card._handleAdjustAutomationEvent(new CustomEvent('adjust-automation', {
      detail: {
        entityId: 'automation.kitchen_lights',
        friendlyName: 'Kitchen Lights',
        resumeAt: '2026-04-29T13:00:00',
      },
    }));
    expect(card._adjustModalOpen).toBe(true);
    expect(card._adjustModalEntityId).toBe('automation.kitchen_lights');
    expect(card._adjustModalFriendlyName).toBe('Kitchen Lights');
    expect(card._adjustModalResumeAt).toBe('2026-04-29T13:00:00');

    card._handleAdjustGroupEvent(new CustomEvent('adjust-group', {
      detail: {
        entityIds: ['automation.kitchen_lights', 'automation.office_fan'],
        friendlyNames: ['Kitchen Lights', 'Office Fan'],
        resumeAt: '2026-04-29T14:00:00',
      },
    }));
    expect(card._adjustModalEntityIds).toEqual(['automation.kitchen_lights', 'automation.office_fan']);
    expect(card._adjustModalFriendlyNames).toEqual(['Kitchen Lights', 'Office Fan']);
    expect(card._adjustModalEntityId).toBe('');

    card._handleCloseModalEvent();
    expect(card._adjustModalOpen).toBe(false);
    expect(card._adjustModalEntityIds).toEqual([]);

    card._guardrailConfirmOpen = true;
    card._handleGuardrailCancel();
    expect(card._guardrailConfirmOpen).toBe(false);
    const snoozeSpy = vi.spyOn(card, '_snooze').mockResolvedValue(undefined);
    await card._handleGuardrailContinue();
    expect(card._guardrailConfirmOpen).toBe(false);
    expect(snoozeSpy).toHaveBeenCalledWith(true);
  });

  test('service handlers call feature modules, haptics, and success toasts', async () => {
    const card = await connectCard();
    mocks.runWakeFeature.mockResolvedValue(undefined);
    mocks.runWakeAllFeature.mockResolvedValue(undefined);
    mocks.runAdjustFeature.mockResolvedValue({ nextResumeAt: '2026-04-29T15:00:00' });
    mocks.runCancelScheduledFeature.mockResolvedValue(undefined);

    await card._handleWakeEvent(new CustomEvent('wake-automation', {
      detail: { entityId: 'automation.kitchen_lights' },
    }));
    expect(mocks.runWakeFeature).toHaveBeenCalledWith(card.hass, 'automation.kitchen_lights');
    expect(mocks.hapticFeedback).toHaveBeenCalledWith('success');
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toContain('Automation resumed successfully');

    await card._handleWakeAllEvent();
    expect(mocks.runWakeAllFeature).toHaveBeenCalledWith(card.hass);
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toContain('All automations resumed successfully');

    card._adjustModalResumeAt = '2026-04-29T14:00:00';
    await card._handleAdjustTimeEvent(new CustomEvent('adjust-time', {
      detail: { entityId: 'automation.kitchen_lights', minutes: 15 },
    }));
    expect(mocks.runAdjustFeature).toHaveBeenCalledWith(
      card.hass,
      { entityId: 'automation.kitchen_lights', minutes: 15 },
      '2026-04-29T14:00:00'
    );
    expect(card._adjustModalResumeAt).toBe('2026-04-29T15:00:00');
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toContain('Snooze time adjusted');

    await card._cancelScheduled('automation.kitchen_lights');
    expect(mocks.runCancelScheduledFeature).toHaveBeenCalledWith(card.hass, 'automation.kitchen_lights');
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toContain('Scheduled snooze cancelled successfully');
  });

  test('service handlers fail closed with failure haptics and no success toast', async () => {
    const card = await connectCard();
    mocks.runWakeFeature.mockRejectedValueOnce(new Error('wake failed'));
    mocks.runWakeAllFeature.mockRejectedValueOnce(new Error('wake all failed'));
    mocks.runAdjustFeature.mockRejectedValueOnce(new Error('adjust failed'));
    mocks.runCancelScheduledFeature.mockRejectedValueOnce(new Error('cancel failed'));

    await card._wake('automation.kitchen_lights');
    await card._handleWakeAllEvent();
    await card._handleAdjustTimeEvent(new CustomEvent('adjust-time', {
      detail: { entityId: 'automation.kitchen_lights', minutes: 15 },
    }));
    await card._cancelScheduled('automation.kitchen_lights');

    expect(mocks.hapticFeedback).toHaveBeenCalledWith('failure');
    expect(mocks.hapticFeedback).toHaveBeenCalledTimes(4);
    expect(card.shadowRoot?.querySelector('.toast')).toBeNull();

    const detached = createCard();
    mocks.runWakeFeature.mockResolvedValueOnce(undefined);
    await detached._wake('automation.office_fan');
    expect(detached._toastTimeout).toBeNull();
  });

  test('snooze success clears state, refreshes recent IDs, and undo restores or selects failures', async () => {
    const card = await connectCard((el) => {
      el._selected = ['automation.kitchen_lights', 'automation.office_fan'];
    });
    mocks.runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Snoozed 2 automations for 30 minutes',
      lastDuration: { minutes: 30, duration: { days: 0, hours: 0, minutes: 30 }, timestamp: Date.now() },
    });
    mocks.runUndoFeature.mockResolvedValue({ succeeded: ['automation.kitchen_lights'], failed: [] });

    await card._snooze();

    expect(mocks.runPauseFeature).toHaveBeenCalledWith(expect.objectContaining({
      hass: card.hass,
      selected: ['automation.kitchen_lights', 'automation.office_fan'],
      scheduleMode: false,
      forceConfirm: false,
    }));
    expect(card._selected).toEqual([]);
    expect(card._disableAtDate).toBe('');
    expect(card._lastDuration?.minutes).toBe(30);
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toContain('Snoozed 2 automations for 30 minutes');

    card.shadowRoot?.querySelector<HTMLButtonElement>('.toast-undo-btn')?.click();
    await Promise.resolve();
    expect(mocks.runUndoFeature).toHaveBeenCalledWith(card.hass, ['automation.kitchen_lights', 'automation.office_fan'], {
      wasScheduleMode: false,
      hadDisableAt: false,
    });
    expect(card._selected).toEqual(['automation.kitchen_lights', 'automation.office_fan']);
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toContain('Restored 2 automations');

    mocks.runUndoFeature.mockResolvedValue({ succeeded: [], failed: ['automation.office_fan'] });
    card._selected = ['automation.office_fan'];
    await card._snooze();
    card.shadowRoot?.querySelector<HTMLButtonElement>('.toast-undo-btn')?.click();
    await Promise.resolve();
    expect(card._selected).toEqual(['automation.office_fan']);
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toContain('Failed to undo');
  });

  test('snooze validation covers empty, loading, zero-duration, confirm-required, aborted, and missing hass paths', async () => {
    const card = await connectCard();

    await card._snooze();
    expect(mocks.runPauseFeature).not.toHaveBeenCalled();

    card._selected = ['automation.kitchen_lights'];
    card._loading = true;
    await card._snooze();
    expect(mocks.runPauseFeature).not.toHaveBeenCalled();

    card._loading = false;
    card._duration = 0;
    await card._snooze();
    expect(mocks.runPauseFeature).not.toHaveBeenCalled();

    card._duration = 30 * 60 * 1000;
    mocks.runPauseFeature.mockResolvedValueOnce({ status: 'confirm_required' });
    await card._snooze(true);
    expect(card._guardrailConfirmOpen).toBe(true);
    expect(card._loading).toBe(false);

    card._guardrailConfirmOpen = false;
    mocks.runPauseFeature.mockResolvedValueOnce({ status: 'aborted' });
    await card._snooze(true);
    expect(card._loading).toBe(false);

    card.hass = undefined;
    await card._snooze(true);
    expect(card._loading).toBe(false);
  });

  test('scheduled snooze validation blocks missing, past, and overlapping times before service calls', async () => {
    const card = await connectCard((el) => {
      el._selected = ['automation.kitchen_lights'];
      el._scheduleMode = true;
    });

    await card._snooze();
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toBe('Please set a complete resume date and time');
    expect(mocks.runPauseFeature).not.toHaveBeenCalled();

    card._resumeAtDate = '2026-04-29';
    card._resumeAtTime = '11:59';
    await card._snooze();
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toBe('Resume time must be in the future');
    expect(mocks.runPauseFeature).not.toHaveBeenCalled();

    card._disableAtDate = '2026-04-29';
    card._disableAtTime = '13:00';
    card._resumeAtDate = '2026-04-29';
    card._resumeAtTime = '12:30';
    await card._snooze();
    expect(getText(card.shadowRoot?.querySelector('.toast'))).toBe('Snooze time must be before resume time');
    expect(mocks.runPauseFeature).not.toHaveBeenCalled();
  });

  test('render exposes exact card text, status summaries, scheduled list, guardrail, and snooze button states', async () => {
    const paused = {
      'automation.kitchen_lights': {
        friendly_name: 'Kitchen Lights',
        resume_at: '2026-04-29T13:00:00',
        paused_at: '2026-04-29T12:00:00',
        days: 0,
        hours: 1,
        minutes: 0,
      },
    };
    const scheduled = {
      'automation.office_fan': {
        friendly_name: 'Office Fan',
        disable_at: '2026-04-29T12:30:00',
        resume_at: '2026-04-29T13:30:00',
      },
    };
    const card = await connectCard((el) => {
      el.hass = createHass({ paused, scheduled });
      el._selected = ['automation.kitchen_lights'];
      el._guardrailConfirmOpen = true;
    });

    expect(getText(card.shadowRoot?.querySelector('.header'))).toContain('AutoSnooze');
    expect(getText(card.shadowRoot?.querySelector('.status-summary'))).toBe('1 active, 1 scheduled');
    expect(card.shadowRoot?.querySelector('.sensor-health-banner')).toBeNull();
    expect(card.shadowRoot?.querySelector('autosnooze-active-pauses')).not.toBeNull();
    expect(card.shadowRoot?.querySelector('autosnooze-adjust-modal')).not.toBeNull();

    const scheduledList = card.shadowRoot?.querySelector('.scheduled-list');
    expect(scheduledList?.getAttribute('aria-label')).toBe('Scheduled snoozes');
    expect(getText(scheduledList?.querySelector('.list-header'))).toContain('Scheduled Snoozes (1)');
    expect(scheduledList?.querySelector('.scheduled-item')?.getAttribute('aria-label')).toBe(
      'Scheduled pause for Office Fan'
    );
    expect(getText(scheduledList?.querySelector('.scheduled-item'))).toContain('Disables:');
    expect(getText(scheduledList?.querySelector('.scheduled-item'))).toContain('Resumes:');
    expect(getText(scheduledList?.querySelector('.cancel-scheduled-btn'))).toBe('Cancel');
    expect(scheduledList?.querySelector('.cancel-scheduled-btn')?.getAttribute('aria-label')).toBe(
      'Cancel scheduled pause for Office Fan'
    );

    expect(getText(card.shadowRoot?.querySelector('.guardrail-title'))).toBe('Review required');
    expect(getText(card.shadowRoot?.querySelector('.guardrail-body'))).toContain('autosnooze_confirm');
    expect(getText(card.shadowRoot?.querySelector('.guardrail-cancel-btn'))).toBe('Cancel');
    expect(getText(card.shadowRoot?.querySelector('.guardrail-continue-btn'))).toBe('Continue');

    const snoozeButton = card.shadowRoot?.querySelector<HTMLButtonElement>('.snooze-btn');
    expect(snoozeButton?.disabled).toBe(false);
    expect(snoozeButton?.getAttribute('aria-label')).toBe('Snooze 1 automations');
    expect(snoozeButton?.getAttribute('aria-busy')).toBe('false');
    expect(getText(snoozeButton)).toBe('Snooze (1)');
    expect(card.shadowRoot?.textContent).not.toContain('Stryker was here!');

    card._scheduleMode = true;
    card._resumeAtDate = '';
    card._resumeAtTime = '';
    await card.updateComplete;
    const scheduleDisabled = card.shadowRoot?.querySelector<HTMLButtonElement>('.snooze-btn');
    expect(scheduleDisabled?.disabled).toBe(true);
    expect(scheduleDisabled?.getAttribute('aria-label')).toBe('Schedule snooze for 1 automations');
    expect(getText(scheduleDisabled)).toBe('Schedule (1)');

    card._resumeAtDate = '2026-04-29';
    card._resumeAtTime = '13:00';
    card._loading = true;
    await card.updateComplete;
    const loadingButton = card.shadowRoot?.querySelector<HTMLButtonElement>('.snooze-btn');
    expect(loadingButton?.disabled).toBe(true);
    expect(loadingButton?.getAttribute('aria-label')).toBe('Snoozing automations');
    expect(loadingButton?.getAttribute('aria-busy')).toBe('true');
    expect(getText(loadingButton)).toBe('Snoozing...');
  });

  test('render covers missing sensor banner and empty active/scheduled sections', async () => {
    const card = await connectCard((el) => {
      el.hass = createHass({ sensor: false });
    });
    expect(getText(card.shadowRoot?.querySelector('.sensor-health-banner'))).toBe(
      'AutoSnooze status sensor is unavailable. Pause controls are still shown, but active/scheduled state may be stale.'
    );
    expect(card.shadowRoot?.querySelector('.status-summary')).toBeNull();
    expect(card.shadowRoot?.querySelector('autosnooze-active-pauses')).toBeNull();
    expect(card.shadowRoot?.querySelector('.scheduled-list')).toBeNull();
    expect(card.shadowRoot?.textContent).not.toContain('Stryker was here!');
  });
});
