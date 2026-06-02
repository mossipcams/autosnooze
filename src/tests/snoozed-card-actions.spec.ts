import { beforeEach, describe, expect, test, vi } from 'vitest';

const { runWakeAction, runWakeAllAction, runAdjustAction } = vi.hoisted(() => ({
  runWakeAction: vi.fn().mockResolvedValue(undefined),
  runWakeAllAction: vi.fn().mockResolvedValue(undefined),
  runAdjustAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../components/autosnooze-actions-controller.js', () => ({
  runWakeAction,
  runWakeAllAction,
  runAdjustAction,
}));

import { AutoSnoozeSnoozedCard } from '../components/autosnooze-snoozed-card.js';
import type { HomeAssistant } from '../types/hass.js';

const TEST_TAG = 'test-snoozed-card-actions';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, AutoSnoozeSnoozedCard);
}

type SnoozedCardHarness = {
  hass: HomeAssistant;
  config: { type: string };
  shadowRoot: ShadowRoot | null;
  updateComplete: Promise<unknown>;
  _adjustModal: { adjustModalOpen: boolean; adjustModalEntityId: string };
};

function futureIso(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

function makeHass(pausedIds: string[]): HomeAssistant {
  const resumeAt = futureIso(60);
  const paused: Record<string, unknown> = {};
  for (const id of pausedIds) {
    paused[id] = {
      friendly_name: id,
      resume_at: resumeAt,
      paused_at: new Date().toISOString(),
      days: 0,
      hours: 1,
      minutes: 0,
    };
  }
  return {
    states: {
      'sensor.autosnooze_snoozed_automations': {
        state: String(pausedIds.length),
        attributes: { schema_version: 1, paused, scheduled: {} },
      },
    },
    locale: { language: 'en' },
  } as unknown as HomeAssistant;
}

async function mountCard(pausedIds: string[]): Promise<SnoozedCardHarness> {
  const el = document.createElement(TEST_TAG) as unknown as SnoozedCardHarness;
  el.hass = makeHass(pausedIds);
  el.config = { type: 'custom:autosnooze-snoozed-card' };
  document.body.appendChild(el as unknown as HTMLElement);
  await el.updateComplete;
  return el;
}

function dispatchOn(root: ShadowRoot | null, selector: string, event: CustomEvent): void {
  const child = root?.querySelector(selector);
  if (!child) throw new Error(`Missing child for selector: ${selector}`);
  child.dispatchEvent(event);
}

describe('Snoozed-only card actions', () => {
  beforeEach(() => {
    runWakeAction.mockClear();
    runWakeAllAction.mockClear();
    runAdjustAction.mockClear();
  });

  test('resume delegates to the shared wake action', async () => {
    const el = await mountCard(['automation.kitchen', 'automation.hallway']);

    dispatchOn(
      el.shadowRoot,
      'autosnooze-active-pauses',
      new CustomEvent('wake-automation', {
        detail: { entityId: 'automation.kitchen' },
        bubbles: true,
        composed: true,
      })
    );
    await el.updateComplete;

    expect(runWakeAction).toHaveBeenCalledWith(el.hass, 'automation.kitchen');
  });

  test('resume-all delegates to the shared wake-all action', async () => {
    const el = await mountCard(['automation.kitchen', 'automation.hallway']);

    dispatchOn(
      el.shadowRoot,
      'autosnooze-active-pauses',
      new CustomEvent('wake-all', { bubbles: true, composed: true })
    );
    await el.updateComplete;

    expect(runWakeAllAction).toHaveBeenCalledWith(el.hass);
  });

  test('adjust opens the modal and routes adjust-time through the shared action', async () => {
    const el = await mountCard(['automation.kitchen']);

    dispatchOn(
      el.shadowRoot,
      'autosnooze-active-pauses',
      new CustomEvent('adjust-automation', {
        detail: {
          entityId: 'automation.kitchen',
          friendlyName: 'Kitchen Lights',
          resumeAt: futureIso(60),
        },
        bubbles: true,
        composed: true,
      })
    );
    await el.updateComplete;

    expect(el._adjustModal.adjustModalOpen).toBe(true);
    const modal = el.shadowRoot?.querySelector('autosnooze-adjust-modal') as unknown as {
      open: boolean;
      entityId: string;
    };
    expect(modal.open).toBe(true);
    expect(modal.entityId).toBe('automation.kitchen');

    dispatchOn(
      el.shadowRoot,
      'autosnooze-adjust-modal',
      new CustomEvent('adjust-time', {
        detail: { entityId: 'automation.kitchen', minutes: 15 },
        bubbles: true,
        composed: true,
      })
    );
    await el.updateComplete;

    expect(runAdjustAction).toHaveBeenCalledWith(el.hass, 'automation.kitchen', { minutes: 15 });
  });

  test('closes the open modal when its paused item disappears after an update', async () => {
    const el = await mountCard(['automation.kitchen']);

    dispatchOn(
      el.shadowRoot,
      'autosnooze-active-pauses',
      new CustomEvent('adjust-automation', {
        detail: {
          entityId: 'automation.kitchen',
          friendlyName: 'Kitchen Lights',
          resumeAt: futureIso(60),
        },
        bubbles: true,
        composed: true,
      })
    );
    await el.updateComplete;
    expect(el._adjustModal.adjustModalOpen).toBe(true);

    // The automation is resumed elsewhere; the sensor no longer lists it.
    el.hass = makeHass([]);
    await el.updateComplete;

    expect(el._adjustModal.adjustModalOpen).toBe(false);
    expect(el._adjustModal.adjustModalEntityId).toBe('');
  });
});
