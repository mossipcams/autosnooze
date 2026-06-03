import { describe, expect, test, vi } from 'vitest';
import { AutoSnoozeActivePauses } from '../components/autosnooze-active-pauses.js';
import type { PauseGroup } from '../types/automation.js';

type TestActivePauses = {
  connectedCallback: () => void;
  disconnectedCallback: () => void;
  _countdownState: {
    interval: ReturnType<typeof globalThis.setInterval> | null;
    syncTimeout: ReturnType<typeof globalThis.setTimeout> | null;
  };
};

describe('AutoSnoozeActivePauses countdown lifecycle', () => {
  test('schedules a bootstrap sync timeout when connected before pause groups are populated', () => {
    vi.useFakeTimers();

    if (!customElements.get('test-autosnooze-active-pauses')) {
      customElements.define('test-autosnooze-active-pauses', AutoSnoozeActivePauses);
    }

    const element = document.createElement('test-autosnooze-active-pauses') as unknown as TestActivePauses;

    element.connectedCallback();

    expect(element._countdownState.interval).toBeNull();
    expect(element._countdownState.syncTimeout).not.toBeNull();

    element.disconnectedCallback();
    vi.useRealTimers();
  });
});

describe('AutoSnoozeActivePauses notification controls', () => {
  test('renders a clear-notification control only for paused automations with notification config', async () => {
    const tag = 'test-autosnooze-active-pauses-render';
    if (!customElements.get(tag)) {
      customElements.define(tag, AutoSnoozeActivePauses);
    }

    const element = document.createElement(tag) as AutoSnoozeActivePauses;
    element.hass = { locale: { language: 'en' } } as never;
    element.pausedCount = 2;
    element.pauseGroups = [
      {
        resumeAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        automations: [
          {
            entity_id: 'automation.kitchen',
            friendly_name: 'Kitchen',
            resume_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            paused_at: new Date().toISOString(),
            days: 0,
            hours: 1,
            minutes: 0,
            notification_trigger: 'end',
          },
          {
            entity_id: 'automation.hallway',
            friendly_name: 'Hallway',
            resume_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            paused_at: new Date().toISOString(),
            days: 0,
            hours: 1,
            minutes: 0,
          },
        ],
      },
    ] as PauseGroup[];

    document.body.appendChild(element);
    await element.updateComplete;

    const clearButtons = element.shadowRoot?.querySelectorAll('.clear-notification-btn');
    expect(clearButtons).toHaveLength(1);
    expect(clearButtons?.[0]?.textContent?.trim()).toBe('Remove notification');

    element.pauseGroups = [
      {
        ...element.pauseGroups[0]!,
        automations: element.pauseGroups[0]!.automations.map((automation) => ({
          ...automation,
          notification_trigger: undefined,
        })),
      },
    ];
    await element.updateComplete;

    expect(element.shadowRoot?.querySelectorAll('.clear-notification-btn')).toHaveLength(0);

    document.body.removeChild(element);
  });
});

describe('AutoSnoozeActivePauses readonly mode', () => {
  function makeGroups() {
    const resumeAt = new Date(Date.now() + 3600000).toISOString();
    return [{
      resumeAt,
      automations: [
        { entity_id: 'automation.a', friendly_name: 'Auto A', resume_at: resumeAt, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
        { entity_id: 'automation.b', friendly_name: 'Auto B', resume_at: resumeAt, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
      ],
    }];
  }

  test('renders no resume/adjust controls or interactive roles when readonly', async () => {
    const el = document.createElement('autosnooze-active-pauses') as AutoSnoozeActivePauses;
    el.pausedCount = 2;
    el.pauseGroups = makeGroups();
    el.readonly = true;
    document.body.appendChild(el);
    await el.updateComplete;

    const root = el.shadowRoot!;
    expect(root.querySelectorAll('.paused-item').length).toBe(2);
    expect(root.querySelector('.wake-btn')).toBeNull();
    expect(root.querySelector('.wake-all')).toBeNull();
    expect(root.querySelector('button')).toBeNull();
    expect(root.querySelector('[role="button"]')).toBeNull();
    expect(root.querySelector('.pause-group-header')?.getAttribute('role')).toBeNull();

    document.body.removeChild(el);
  });

  test('still renders resume controls when not readonly (default)', async () => {
    const el = document.createElement('autosnooze-active-pauses') as AutoSnoozeActivePauses;
    el.pausedCount = 2;
    el.pauseGroups = makeGroups();
    document.body.appendChild(el);
    await el.updateComplete;

    const root = el.shadowRoot!;
    expect(root.querySelectorAll('.wake-btn').length).toBe(2);
    expect(root.querySelector('.wake-all')).not.toBeNull();

    document.body.removeChild(el);
  });
});
