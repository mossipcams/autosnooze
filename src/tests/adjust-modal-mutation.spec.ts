import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { AutoSnoozeAdjustModal } from '../components/autosnooze-adjust-modal.js';

const cardShellMocks = vi.hoisted(() => ({
  lastTick: undefined as undefined | (() => void),
  startCardShellCountdown: vi.fn((onTick: () => void) => {
    cardShellMocks.lastTick = onTick;
    return { interval: 55, syncTimeout: null };
  }),
  stopCardShellCountdown: vi.fn(),
}));

vi.mock('../features/card-shell/index.js', () => cardShellMocks);

const adjustModalModule = await import('../components/autosnooze-adjust-modal.js');

if (!customElements.get('autosnooze-adjust-modal-mutation')) {
  customElements.define('autosnooze-adjust-modal-mutation', adjustModalModule.AutoSnoozeAdjustModal);
}

function createModal(): AutoSnoozeAdjustModal {
  return document.createElement('autosnooze-adjust-modal-mutation') as AutoSnoozeAdjustModal;
}

async function connectModal(setup: (modal: AutoSnoozeAdjustModal) => void = () => {}): Promise<AutoSnoozeAdjustModal> {
  const modal = createModal();
  modal.hass = { locale: { language: 'en-US' } } as never;
  setup(modal);
  document.body.appendChild(modal);
  await modal.updateComplete;
  return modal;
}

function getText(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function lastEvent(events: CustomEvent[]): CustomEvent | undefined {
  return events[events.length - 1];
}

describe('adjust modal mutation boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
    cardShellMocks.lastTick = undefined;
    cardShellMocks.startCardShellCountdown.mockClear();
    cardShellMocks.stopCardShellCountdown.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('starts and stops synchronized countdowns and ticks request an update', () => {
    const modal = createModal();
    const requestUpdate = vi.spyOn(modal, 'requestUpdate');

    modal._startSynchronizedCountdown();

    expect(cardShellMocks.stopCardShellCountdown).toHaveBeenCalledTimes(1);
    expect(cardShellMocks.startCardShellCountdown).toHaveBeenCalledTimes(1);
    requestUpdate.mockClear();
    cardShellMocks.lastTick?.();
    expect(requestUpdate).toHaveBeenCalledTimes(1);

    modal._stopCountdown();
    expect(cardShellMocks.stopCardShellCountdown).toHaveBeenCalledTimes(2);
    modal.disconnectedCallback();
    expect(cardShellMocks.stopCardShellCountdown).toHaveBeenCalledTimes(3);
  });

  test('open property changes start and stop countdown lifecycle', () => {
    const modal = createModal();

    modal.open = true;
    modal.updated(new Map([['open', false]]) as never);
    expect(cardShellMocks.startCardShellCountdown).toHaveBeenCalledTimes(1);

    modal.open = false;
    modal.updated(new Map([['open', true]]) as never);
    expect(cardShellMocks.stopCardShellCountdown).toHaveBeenCalledTimes(2);

    modal.open = true;
    modal.updated(new Map([['resumeAt', 'old']]) as never);
    expect(cardShellMocks.startCardShellCountdown).toHaveBeenCalledTimes(1);
  });

  test('decrement disabled boundary keeps at least one minute remaining', () => {
    const modal = createModal();

    expect(modal._isDecrementDisabled(15 * 60 * 1000)).toBe(true);

    modal.resumeAt = '2026-04-29T12:16:00';
    expect(modal._isDecrementDisabled(15 * 60 * 1000)).toBe(false);

    modal.resumeAt = '2026-04-29T12:15:59';
    expect(modal._isDecrementDisabled(15 * 60 * 1000)).toBe(true);

    modal.resumeAt = '2026-04-29T12:31:00';
    expect(modal._isDecrementDisabled(30 * 60 * 1000)).toBe(false);
  });

  test('adjust and close events carry exact payloads and composed bubbling flags', () => {
    const single = createModal();
    single.entityId = 'automation.kitchen_lights';
    const singleAdjustEvents: CustomEvent[] = [];
    const closeEvents: CustomEvent[] = [];
    single.addEventListener('adjust-time', (event) => singleAdjustEvents.push(event as CustomEvent));
    single.addEventListener('close-modal', (event) => closeEvents.push(event as CustomEvent));

    single._fireAdjustTime({ minutes: -30 });
    expect(singleAdjustEvents[0]?.detail).toEqual({
      entityId: 'automation.kitchen_lights',
      minutes: -30,
    });
    expect(singleAdjustEvents[0]?.bubbles).toBe(true);
    expect(singleAdjustEvents[0]?.composed).toBe(true);

    single._close();
    expect(closeEvents[0]?.bubbles).toBe(true);
    expect(closeEvents[0]?.composed).toBe(true);

    const group = createModal();
    group.entityIds = ['automation.one'];
    const groupAdjustEvents: CustomEvent[] = [];
    group.addEventListener('adjust-time', (event) => groupAdjustEvents.push(event as CustomEvent));
    group._fireAdjustTime({ hours: 1 });
    expect(groupAdjustEvents[0]?.detail).toEqual({
      entityIds: ['automation.one'],
      hours: 1,
    });
    expect(groupAdjustEvents[0]?.bubbles).toBe(true);
    expect(groupAdjustEvents[0]?.composed).toBe(true);
  });

  test('overlay click and Escape close only from the overlay itself', async () => {
    const modal = await connectModal((el) => {
      el.open = true;
      el.entityId = 'automation.kitchen_lights';
      el.friendlyName = 'Kitchen Lights';
      el.resumeAt = '2026-04-29T12:05:00';
    });
    const closeEvents: CustomEvent[] = [];
    modal.addEventListener('close-modal', (event) => closeEvents.push(event as CustomEvent));

    const overlay = modal.shadowRoot?.querySelector<HTMLElement>('.modal-overlay');
    const content = modal.shadowRoot?.querySelector<HTMLElement>('.modal-content');
    const click = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(click, 'target', { value: content });
    Object.defineProperty(click, 'currentTarget', { value: overlay });
    modal._handleOverlayClick(click);
    expect(closeEvents).toHaveLength(0);

    const overlayClick = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(overlayClick, 'target', { value: overlay });
    Object.defineProperty(overlayClick, 'currentTarget', { value: overlay });
    modal._handleOverlayClick(overlayClick);
    expect(closeEvents).toHaveLength(1);

    content?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(closeEvents).toHaveLength(1);

    overlay?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(closeEvents).toHaveLength(1);
    overlay?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closeEvents).toHaveLength(2);
  });

  test('single modal renders exact labels, aria labels, countdown fallback, and button payloads', async () => {
    const modal = await connectModal((el) => {
      el.open = true;
      el.entityId = 'automation.kitchen_lights';
      el.friendlyName = '';
      el.resumeAt = '2026-04-29T11:59:00';
    });
    const events: CustomEvent[] = [];
    modal.addEventListener('adjust-time', (event) => events.push(event as CustomEvent));

    expect(getText(modal.shadowRoot?.querySelector('.modal-title'))).toBe('automation.kitchen_lights');
    expect(modal.shadowRoot?.querySelector('.modal-subtitle')).toBeNull();
    expect(modal.shadowRoot?.querySelector('.modal-close')?.getAttribute('aria-label')).toBe('Close adjust modal');
    expect(getText(modal.shadowRoot?.querySelector('.remaining-label'))).toBe('Time remaining');
    expect(getText(modal.shadowRoot?.querySelector('.remaining-time'))).toBe('Resuming...');
    expect(getText(modal.shadowRoot?.querySelectorAll('.adjust-section-label')[0])).toBe('Add time');
    expect(getText(modal.shadowRoot?.querySelectorAll('.adjust-section-label')[1])).toBe('Reduce time');

    const increments = Array.from(modal.shadowRoot?.querySelectorAll<HTMLButtonElement>('.increment') ?? []);
    expect(increments.map(getText)).toEqual(['+15m', '+30m', '+1h', '+2h']);
    expect(increments.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Add +15m',
      'Add +30m',
      'Add +1h',
      'Add +2h',
    ]);
    increments[2]?.click();
    expect(lastEvent(events)?.detail).toEqual({ entityId: 'automation.kitchen_lights', hours: 1 });

    modal.resumeAt = '2026-04-29T12:45:00';
    await modal.updateComplete;
    const decrements = Array.from(modal.shadowRoot?.querySelectorAll<HTMLButtonElement>('.decrement') ?? []);
    expect(decrements.map(getText)).toEqual(['-15m', '-30m']);
    expect(decrements.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Reduce by -15m',
      'Reduce by -30m',
    ]);
    decrements[1]?.click();
    expect(lastEvent(events)?.detail).toEqual({ entityId: 'automation.kitchen_lights', minutes: -30 });
    expect(modal.shadowRoot?.textContent).not.toContain('Stryker was here!');
  });

  test('group modal renders title, comma-separated subtitle, and group payloads', async () => {
    const modal = await connectModal((el) => {
      el.open = true;
      el.entityIds = ['automation.one', 'automation.two'];
      el.friendlyNames = ['One', 'Two'];
      el.resumeAt = '2026-04-29T12:30:00';
    });
    const events: CustomEvent[] = [];
    modal.addEventListener('adjust-time', (event) => events.push(event as CustomEvent));

    expect(getText(modal.shadowRoot?.querySelector('.modal-title'))).toBe('Adjust 2 automations');
    expect(getText(modal.shadowRoot?.querySelector('.modal-subtitle'))).toBe('One, Two');
    expect(getText(modal.shadowRoot?.querySelector('.remaining-time'))).toBe('30m 0s');

    modal.shadowRoot?.querySelector<HTMLButtonElement>('.increment')?.click();
    expect(lastEvent(events)?.detail).toEqual({
      entityIds: ['automation.one', 'automation.two'],
      minutes: 15,
    });
  });
});
