import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { runWakeFeature, reportTelemetry } = vi.hoisted(() => ({
  runWakeFeature: vi.fn(),
  reportTelemetry: vi.fn(),
}));

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

vi.mock('../features/resume/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/resume/index.js')>();
  return { ...actual, runWakeFeature };
});

vi.mock('../services/telemetry.js', () => ({ reportTelemetry }));

import { AutoSnoozeActivePauses } from '../components/autosnooze-active-pauses.js';
import { AutomationPauseCard } from '../components/autosnooze-card.js';
import { UI_TIMING } from '../constants/index.js';
import type { PauseGroup, PausedAutomation } from '../types/automation.js';
import type { HomeAssistant } from '../types/hass.js';

const LIST_TAG = 'test-active-pauses-resume-group';
const CARD_TAG = 'test-card-resume-group';
if (!customElements.get(LIST_TAG)) customElements.define(LIST_TAG, AutoSnoozeActivePauses);
if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, AutomationPauseCard);

const hass = {
  states: {},
  entities: {},
  areas: {},
  locale: { language: 'en' },
  connection: { sendMessagePromise: async () => [] },
  callService: async () => undefined,
} as unknown as HomeAssistant;

function auto(id: string): PausedAutomation {
  return { entity_id: id, friendly_name: id, resume_at: '2026-04-29T13:00:00', paused_at: '2026-04-29T12:00:00', days: 0, hours: 1, minutes: 0 };
}

const twoGroups: PauseGroup[] = [
  { resumeAt: '2026-04-29T13:00:00', automations: [auto('automation.a'), auto('automation.b')] },
  { resumeAt: '2026-04-29T14:00:00', automations: [auto('automation.c')] },
];

async function mountList(groups: PauseGroup[], readonly = false): Promise<AutoSnoozeActivePauses> {
  const el = document.createElement(LIST_TAG) as AutoSnoozeActivePauses;
  el.hass = hass;
  el.pauseGroups = groups;
  el.pausedCount = groups.reduce((n, g) => n + g.automations.length, 0);
  el.readonly = readonly;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function groupButtons(el: AutoSnoozeActivePauses): HTMLButtonElement[] {
  return [...(el.shadowRoot?.querySelectorAll<HTMLButtonElement>('.wake-group-btn') ?? [])];
}

describe('Resume Group', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
    runWakeFeature.mockReset().mockResolvedValue(undefined);
    reportTelemetry.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('shows only on multi-automation groups when there is more than one group', async () => {
    const el = await mountList(twoGroups);
    const buttons = groupButtons(el);
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.closest('.pause-group')?.querySelectorAll('.paused-item')).toHaveLength(2);
    expect(buttons[0]?.textContent?.trim()).toBe('Resume group');
    expect(buttons[0]?.getAttribute('aria-label')).toBe('Resume 2 automations in this group');
    expect(buttons[0]?.closest('.pause-group-header')).toBeNull();

    expect(groupButtons(await mountList([twoGroups[0]!]))).toHaveLength(0);
    expect(groupButtons(await mountList(twoGroups, true))).toHaveLength(0);
  });

  test('needs a second tap to confirm and never opens the adjust modal', async () => {
    const el = await mountList(twoGroups);
    const wakeEvents: CustomEvent[] = [];
    const adjustEvents: Event[] = [];
    el.addEventListener('wake-group', (e) => wakeEvents.push(e as CustomEvent));
    el.addEventListener('adjust-group', (e) => adjustEvents.push(e));

    groupButtons(el)[0]!.click();
    await el.updateComplete;
    expect(wakeEvents).toHaveLength(0);
    expect(groupButtons(el)[0]?.textContent?.trim()).toBe('Confirm');
    expect(groupButtons(el)[0]?.classList.contains('pending')).toBe(true);
    expect(groupButtons(el)[0]?.getAttribute('aria-label')).toBe('Confirm resuming 2 automations in this group');

    groupButtons(el)[0]!.click();
    await el.updateComplete;
    expect(wakeEvents.map((e) => e.detail)).toEqual([{ entityIds: ['automation.a', 'automation.b'] }]);
    expect(wakeEvents[0]?.bubbles && wakeEvents[0]?.composed).toBe(true);
    expect(adjustEvents).toHaveLength(0);
    expect(groupButtons(el)[0]?.textContent?.trim()).toBe('Resume group');
  });

  test('pending confirmation expires', async () => {
    const el = await mountList(twoGroups);
    const wakeEvents: Event[] = [];
    el.addEventListener('wake-group', (e) => wakeEvents.push(e));

    groupButtons(el)[0]!.click();
    vi.advanceTimersByTime(UI_TIMING.WAKE_ALL_CONFIRM_MS);
    await el.updateComplete;
    expect(groupButtons(el)[0]?.textContent?.trim()).toBe('Resume group');

    groupButtons(el)[0]!.click();
    expect(wakeEvents).toHaveLength(0);
  });

  test('card resumes the whole group in one service call', async () => {
    const card = document.createElement(CARD_TAG) as AutomationPauseCard & { updateComplete: Promise<unknown> };
    card.hass = hass;
    document.body.appendChild(card);
    await card.updateComplete;

    await (card as unknown as { _handleWakeGroupEvent: (e: CustomEvent) => Promise<void> })
      ._handleWakeGroupEvent(new CustomEvent('wake-group', { detail: { entityIds: ['automation.a', 'automation.b'] } }));
    await vi.waitFor(() => expect(runWakeFeature).toHaveBeenCalledTimes(1));
    expect(runWakeFeature).toHaveBeenCalledWith(hass, ['automation.a', 'automation.b']);
    expect(reportTelemetry).toHaveBeenCalledWith(hass, expect.objectContaining({
      event: 'wake_clicked',
      properties: { scope: 'group' },
    }));
    await vi.waitFor(() => expect(card.shadowRoot?.querySelector('autosnooze-toast')?.textContent)
      .toContain('Resumed 2 automations'));
  });
});
