import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { AutoSnoozeActivePauses } from '../components/autosnooze-active-pauses.js';
import type { PauseGroup, PausedAutomation } from '../types/automation.js';

const cardShellMocks = vi.hoisted(() => ({
  lastTick: undefined as undefined | (() => void),
  startCardShellCountdown: vi.fn((onTick: () => void) => {
    cardShellMocks.lastTick = onTick;
    return { interval: 123, syncTimeout: null };
  }),
  stopCardShellCountdown: vi.fn(),
}));

const hapticMock = vi.hoisted(() => vi.fn());

vi.mock('../features/card-shell/index.js', () => cardShellMocks);
vi.mock('../utils/haptic.js', () => ({ hapticFeedback: hapticMock }));

const activePausesModule = await import('../components/autosnooze-active-pauses.js');

if (!customElements.get('autosnooze-active-pauses-mutation')) {
  customElements.define('autosnooze-active-pauses-mutation', activePausesModule.AutoSnoozeActivePauses);
}

function createPausedAutomation(
  entityId: string,
  friendlyName: string,
  resumeAt = '2026-04-29T13:00:00'
): PausedAutomation {
  return {
    entity_id: entityId,
    friendly_name: friendlyName,
    resume_at: resumeAt,
    paused_at: '2026-04-29T12:00:00',
    days: 0,
    hours: 1,
    minutes: 0,
  };
}

function createGroup(input: {
  resumeAt?: string;
  disableAt?: string;
  automations?: PausedAutomation[];
} = {}): PauseGroup {
  return {
    resumeAt: input.resumeAt ?? '2026-04-29T13:00:00',
    disableAt: input.disableAt,
    automations: input.automations ?? [
      createPausedAutomation('automation.kitchen_lights', 'Kitchen Lights'),
    ],
  };
}

function createElement(): AutoSnoozeActivePauses {
  return document.createElement('autosnooze-active-pauses-mutation') as AutoSnoozeActivePauses;
}

async function connectElement(
  setup: (element: AutoSnoozeActivePauses) => void = () => {}
): Promise<AutoSnoozeActivePauses> {
  const element = createElement();
  setup(element);
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
}

function getText(element: Element | null): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('active pauses mutation boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
    cardShellMocks.lastTick = undefined;
    cardShellMocks.startCardShellCountdown.mockClear();
    cardShellMocks.stopCardShellCountdown.mockClear();
    hapticMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('keeps static styles wired and renders absolutely nothing for an empty paused count', async () => {
    expect(Array.isArray(activePausesModule.AutoSnoozeActivePauses.styles)).toBe(true);
    expect(activePausesModule.AutoSnoozeActivePauses.styles).toHaveLength(2);

    const element = await connectElement((el) => {
      el.pausedCount = 0;
      el.pauseGroups = [createGroup()];
    });

    expect(element.shadowRoot?.textContent).not.toContain('Stryker was here!');
    expect(element.shadowRoot?.querySelector('.snooze-list')).toBeNull();
  });

  test('renders localized live and scheduled group details with fallback automation names', async () => {
    const element = await connectElement((el) => {
      el.hass = { locale: { language: 'en-US' } } as never;
      el.pausedCount = 2;
      el.pauseGroups = [
        createGroup({
          resumeAt: '2026-04-29T12:01:05',
          automations: [
            createPausedAutomation('automation.front_door', ''),
          ],
        }),
        createGroup({
          resumeAt: '2026-04-29T13:00:00',
          disableAt: '2026-04-29T12:30:00',
          automations: [
            createPausedAutomation('automation.office_fan', 'Office Fan'),
          ],
        }),
      ];
    });

    const list = element.shadowRoot?.querySelector('.snooze-list');
    expect(list?.getAttribute('role')).toBe('region');
    expect(list?.getAttribute('aria-label')).toBe('Snoozed automations');
    expect(getText(element.shadowRoot?.querySelector('.list-header'))).toContain('Snoozed Automations (2)');

    const headers = element.shadowRoot?.querySelectorAll('.pause-group-header');
    expect(headers?.[0]?.getAttribute('aria-label')).toBe(
      'Adjust snooze time for 1 automations in this group'
    );
    expect(getText(headers?.[0] ?? null)).toBe('1m 5s');
    expect(getText(headers?.[1] ?? null)).toContain('Resumes');
    expect(getText(headers?.[1] ?? null)).toContain('Apr 29');
    expect(getText(headers?.[1] ?? null)).not.toContain('Resuming');

    const names = Array.from(element.shadowRoot?.querySelectorAll('.paused-name') ?? []).map(getText);
    expect(names).toEqual(['automation.front_door', 'Office Fan']);
    expect(getText(element.shadowRoot?.querySelector('.wake-btn'))).toBe('Resume');
    expect(getText(element.shadowRoot?.querySelector('.wake-all'))).toBe('Resume All');
  });

  test('dispatches adjust events from clicks and keyboard activation without waking the row', async () => {
    const element = await connectElement((el) => {
      el.pausedCount = 1;
      el.pauseGroups = [
        createGroup({
          automations: [
            createPausedAutomation('automation.kitchen_lights', 'Kitchen Lights'),
            createPausedAutomation('automation.porch', 'Porch'),
          ],
        }),
      ];
    });
    const adjustEvents: CustomEvent[] = [];
    const groupEvents: CustomEvent[] = [];
    const wakeEvents: CustomEvent[] = [];
    element.addEventListener('adjust-automation', (event) => adjustEvents.push(event as CustomEvent));
    element.addEventListener('adjust-group', (event) => groupEvents.push(event as CustomEvent));
    element.addEventListener('wake-automation', (event) => wakeEvents.push(event as CustomEvent));

    element.shadowRoot?.querySelector<HTMLElement>('.pause-group-header')?.click();
    expect(groupEvents[0]?.detail).toEqual({
      entityIds: ['automation.kitchen_lights', 'automation.porch'],
      friendlyNames: ['Kitchen Lights', 'Porch'],
      resumeAt: '2026-04-29T13:00:00',
    });
    expect(groupEvents[0]?.bubbles).toBe(true);
    expect(groupEvents[0]?.composed).toBe(true);

    const row = element.shadowRoot?.querySelector<HTMLElement>('.paused-item');
    row?.click();
    expect(adjustEvents[0]?.detail).toEqual({
      entityId: 'automation.kitchen_lights',
      friendlyName: 'Kitchen Lights',
      resumeAt: '2026-04-29T13:00:00',
    });

    const ignoredKey = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    row?.dispatchEvent(ignoredKey);
    expect(adjustEvents).toHaveLength(1);

    const preventDefault = vi.fn();
    const enterKey = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(enterKey, 'preventDefault', { value: preventDefault });
    row?.dispatchEvent(enterKey);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(adjustEvents).toHaveLength(2);

    const spaceKey = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    row?.dispatchEvent(spaceKey);
    expect(adjustEvents).toHaveLength(3);

    element.shadowRoot?.querySelector<HTMLButtonElement>('.wake-btn')?.click();
    expect(wakeEvents[0]?.detail).toEqual({ entityId: 'automation.kitchen_lights' });
    expect(wakeEvents[0]?.bubbles).toBe(true);
    expect(wakeEvents[0]?.composed).toBe(true);
    expect(adjustEvents).toHaveLength(3);
  });

  test('starts countdowns only when at least one group has a live countdown and ticks request updates', () => {
    const element = createElement();
    const requestUpdate = vi.spyOn(element, 'requestUpdate');
    element.pauseGroups = [
      createGroup({ disableAt: '2026-04-29T12:30:00' }),
      createGroup({ resumeAt: '2026-04-29T12:05:00' }),
    ];

    element.connectedCallback();

    expect(cardShellMocks.stopCardShellCountdown).toHaveBeenCalledTimes(1);
    expect(cardShellMocks.startCardShellCountdown).toHaveBeenCalledTimes(1);
    expect((element as never as { _hasLiveCountdowns: () => boolean })._hasLiveCountdowns()).toBe(true);

    requestUpdate.mockClear();
    cardShellMocks.lastTick?.();
    expect(requestUpdate).toHaveBeenCalledTimes(1);

    element.pauseGroups = [];
    requestUpdate.mockClear();
    cardShellMocks.lastTick?.();
    expect(requestUpdate).not.toHaveBeenCalled();

    element.disconnectedCallback();
  });

  test('does not start countdowns when every group is scheduled with a static disable time', () => {
    const element = createElement();
    element.pauseGroups = [
      createGroup({ disableAt: '2026-04-29T12:30:00' }),
      createGroup({ disableAt: '2026-04-29T12:45:00' }),
    ];

    element.connectedCallback();

    expect((element as never as { _hasLiveCountdowns: () => boolean })._hasLiveCountdowns()).toBe(false);
    expect(cardShellMocks.startCardShellCountdown).not.toHaveBeenCalled();
    expect((element as never as { _countdownState: { interval: unknown; syncTimeout: unknown } })._countdownState).toEqual({
      interval: null,
      syncTimeout: null,
    });

    element.disconnectedCallback();
  });

  test('bootstraps countdown setup after initially empty groups only when live groups appear', () => {
    const element = createElement();

    element.connectedCallback();
    expect(cardShellMocks.startCardShellCountdown).not.toHaveBeenCalled();
    expect((element as never as { _countdownState: { syncTimeout: unknown } })._countdownState.syncTimeout).not.toBeNull();

    element.pauseGroups = [createGroup({ resumeAt: '2026-04-29T12:10:00' })];
    vi.runOnlyPendingTimers();

    expect((element as never as { _countdownState: { syncTimeout: unknown } })._countdownState.syncTimeout).toBeNull();
    expect(cardShellMocks.startCardShellCountdown).toHaveBeenCalledTimes(1);

    const emptyElement = createElement();
    emptyElement.connectedCallback();
    vi.runOnlyPendingTimers();
    expect(cardShellMocks.startCardShellCountdown).toHaveBeenCalledTimes(1);

    element.disconnectedCallback();
    emptyElement.disconnectedCallback();
  });

  test('resyncs countdown lifecycle only when pause groups change', () => {
    const element = createElement();
    element.pauseGroups = [createGroup()];

    (element as never as { updated: (changedProps: Map<string, unknown>) => void }).updated(new Map([
      ['hass', undefined],
    ]));
    expect(cardShellMocks.startCardShellCountdown).not.toHaveBeenCalled();

    (element as never as { updated: (changedProps: Map<string, unknown>) => void }).updated(new Map([
      ['pauseGroups', []],
    ]));
    expect(cardShellMocks.stopCardShellCountdown).toHaveBeenCalledTimes(1);
    expect(cardShellMocks.startCardShellCountdown).toHaveBeenCalledTimes(1);
  });

  test('wake-all confirmation records haptic feedback, clears pending timers, and dispatches once', async () => {
    const element = await connectElement((el) => {
      el.pausedCount = 2;
      el.pauseGroups = [createGroup({ automations: [
        createPausedAutomation('automation.one', 'One'),
        createPausedAutomation('automation.two', 'Two'),
      ] })];
    });
    const events: CustomEvent[] = [];
    element.addEventListener('wake-all', (event) => events.push(event as CustomEvent));

    element.shadowRoot?.querySelector<HTMLButtonElement>('.wake-all')?.click();
    await element.updateComplete;

    expect(hapticMock).toHaveBeenCalledWith('medium');
    expect((element as never as { _wakeAllPending: boolean })._wakeAllPending).toBe(true);
    expect(element.shadowRoot?.querySelector('.wake-all')?.classList.contains('pending')).toBe(true);
    expect(getText(element.shadowRoot?.querySelector('.wake-all'))).toBe('Confirm Resume All');
    expect(vi.getTimerCount()).toBe(1);

    element.shadowRoot?.querySelector<HTMLButtonElement>('.wake-all')?.click();
    await element.updateComplete;

    expect(events).toHaveLength(1);
    expect(events[0]?.bubbles).toBe(true);
    expect(events[0]?.composed).toBe(true);
    expect((element as never as { _wakeAllPending: boolean })._wakeAllPending).toBe(false);
    expect((element as never as { _wakeAllTimeout: number | null })._wakeAllTimeout).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('wake-all pending branch does not clear a missing timer and timeout reset restores the idle label', async () => {
    const element = await connectElement((el) => {
      el.pausedCount = 2;
      el.pauseGroups = [createGroup({ automations: [
        createPausedAutomation('automation.one', 'One'),
        createPausedAutomation('automation.two', 'Two'),
      ] })];
    });
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const events: CustomEvent[] = [];
    element.addEventListener('wake-all', (event) => events.push(event as CustomEvent));

    (element as never as { _wakeAllPending: boolean; _wakeAllTimeout: number | null })._wakeAllPending = true;
    (element as never as { _wakeAllPending: boolean; _wakeAllTimeout: number | null })._wakeAllTimeout = null;
    (element as never as { _handleWakeAll: () => void })._handleWakeAll();

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
    expect(events).toHaveLength(1);

    element.shadowRoot?.querySelector<HTMLButtonElement>('.wake-all')?.click();
    expect((element as never as { _wakeAllPending: boolean })._wakeAllPending).toBe(true);
    vi.runOnlyPendingTimers();
    await element.updateComplete;

    expect((element as never as { _wakeAllPending: boolean })._wakeAllPending).toBe(false);
    expect((element as never as { _wakeAllTimeout: number | null })._wakeAllTimeout).toBeNull();
    expect(getText(element.shadowRoot?.querySelector('.wake-all'))).toBe('Resume All');
  });
});
