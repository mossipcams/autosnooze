import { describe, expect, test } from 'vitest';
import { AutoSnoozeSnoozedCard } from '../components/autosnooze-snoozed-card.js';
import type { HomeAssistant } from '../types/hass.js';

const TEST_TAG = 'test-snoozed-card-render';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, AutoSnoozeSnoozedCard);
}

function futureIso(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

function makeHass(overrides: Record<string, unknown> = {}): HomeAssistant {
  const resumeAt = futureIso(60);
  return {
    states: {
      'sensor.autosnooze_snoozed_automations': {
        state: '2',
        attributes: {
          schema_version: 1,
          paused: {
            'automation.kitchen': {
              friendly_name: 'Kitchen Lights',
              resume_at: resumeAt,
              paused_at: new Date().toISOString(),
              days: 0,
              hours: 1,
              minutes: 0,
            },
            'automation.hallway': {
              friendly_name: 'Hallway Motion',
              resume_at: resumeAt,
              paused_at: new Date().toISOString(),
              days: 0,
              hours: 1,
              minutes: 0,
            },
          },
          scheduled: {
            'automation.scheduled_one': {
              friendly_name: 'Scheduled One',
              disable_at: futureIso(30),
              resume_at: futureIso(120),
            },
          },
        },
      },
    },
    locale: { language: 'en' },
    ...overrides,
  } as unknown as HomeAssistant;
}

describe('Snoozed-only card rendering', () => {
  test('renders the snoozed list and omits setup, duration, and scheduled UI', async () => {
    const el = document.createElement(TEST_TAG) as AutoSnoozeSnoozedCard;
    el.hass = makeHass();
    el.config = { type: 'custom:autosnooze-snoozed-card' };
    document.body.appendChild(el);
    await el.updateComplete;

    const root = el.shadowRoot!;

    const activePauses = root.querySelector('autosnooze-active-pauses') as unknown as {
      pausedCount: number;
      readonly: boolean;
    } | null;
    expect(activePauses).not.toBeNull();
    expect(activePauses?.pausedCount).toBe(2);
    // Purely informational: the section is rendered read-only.
    expect(activePauses?.readonly).toBe(true);

    // The picker, duration controls, snooze button, scheduled list, and the
    // adjust modal must all be absent (no actions on this card).
    expect(root.querySelector('autosnooze-automation-list')).toBeNull();
    expect(root.querySelector('autosnooze-duration-selector')).toBeNull();
    expect(root.querySelector('.snooze-btn')).toBeNull();
    expect(root.querySelector('.scheduled-list')).toBeNull();
    expect(root.querySelector('autosnooze-adjust-modal')).toBeNull();
  });

  test('renders an empty-state message when nothing is snoozed', async () => {
    const el = document.createElement(TEST_TAG) as AutoSnoozeSnoozedCard;
    el.hass = makeHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { schema_version: 1, paused: {}, scheduled: {} },
        },
      },
    });
    el.config = { type: 'custom:autosnooze-snoozed-card' };
    document.body.appendChild(el);
    await el.updateComplete;

    const root = el.shadowRoot!;
    expect(root.querySelector('autosnooze-active-pauses')).toBeNull();
    expect(root.querySelector('.snoozed-empty')?.textContent?.trim()).toBe(
      'No automations are currently snoozed'
    );
  });

  test('shows the sensor health banner when the sensor entity is missing', async () => {
    const el = document.createElement(TEST_TAG) as AutoSnoozeSnoozedCard;
    el.hass = makeHass({ states: {} });
    el.config = { type: 'custom:autosnooze-snoozed-card' };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('.sensor-health-banner')).not.toBeNull();
  });

  test('passes notification-enabled paused automations through to the shared list UI', async () => {
    const el = document.createElement(TEST_TAG) as AutoSnoozeSnoozedCard;
    el.hass = makeHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '1',
          attributes: {
            schema_version: 1,
            paused: {
              'automation.kitchen': {
                friendly_name: 'Kitchen Lights',
                resume_at: futureIso(60),
                paused_at: new Date().toISOString(),
                days: 0,
                hours: 1,
                minutes: 0,
                notification_trigger: 'end',
              },
            },
            scheduled: {},
          },
        },
      },
    });
    el.config = { type: 'custom:autosnooze-snoozed-card' };
    document.body.appendChild(el);
    await el.updateComplete;

    const activePauses = el.shadowRoot!.querySelector('autosnooze-active-pauses') as unknown as {
      updateComplete: Promise<unknown>;
      pauseGroups?: Array<{
        automations: Array<{
          entity_id: string;
          notification_trigger?: string;
        }>;
      }>;
    } | null;
    expect(activePauses).not.toBeNull();
    await activePauses.updateComplete;
    expect(activePauses?.pauseGroups?.[0]?.automations).toEqual([
      expect.objectContaining({
        entity_id: 'automation.kitchen',
        notification_trigger: 'end',
      }),
    ]);
  });
});
