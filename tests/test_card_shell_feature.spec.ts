// @ts-nocheck -- focused tests for card shell helpers and composition
import { describe, expect, test } from 'vitest';
import '../src/index.ts';
import {
  createAdjustModalState,
  createClosedAdjustModalState,
  createScheduleModeState,
} from '../src/features/card-shell/index.js';

describe('Card Shell Feature', () => {
  test('creates schedule mode defaults from last duration', () => {
    const result = createScheduleModeState({
      enabled: true,
      now: new Date('2026-01-14T10:15:00'),
      resumeMinutes: 90,
    });

    expect(result).toEqual({
      scheduleMode: true,
      disableAtDate: '2026-01-14',
      disableAtTime: '10:15',
      resumeAtDate: '2026-01-14',
      resumeAtTime: '11:45',
    });
  });

  test('creates group adjust modal state for the card shell', () => {
    const result = createAdjustModalState({
      entityIds: ['automation.a', 'automation.b'],
      friendlyNames: ['A', 'B'],
      resumeAt: '2026-01-15T12:00:00.000Z',
    });

    expect(result).toEqual({
      adjustModalOpen: true,
      adjustModalEntityId: '',
      adjustModalFriendlyName: '',
      adjustModalResumeAt: '2026-01-15T12:00:00.000Z',
      adjustModalEntityIds: ['automation.a', 'automation.b'],
      adjustModalFriendlyNames: ['A', 'B'],
    });
  });

  test('card still renders the same composition shell children', async () => {
    const mockHass = createMockHass({
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    const card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    expect(card.shadowRoot.querySelector('autosnooze-automation-list')).not.toBeNull();
    expect(card.shadowRoot.querySelector('autosnooze-duration-selector')).not.toBeNull();
    expect(card.shadowRoot.querySelector('autosnooze-adjust-modal')).not.toBeNull();
  });

  test('creates a reset modal state', () => {
    expect(createClosedAdjustModalState()).toEqual({
      adjustModalOpen: false,
      adjustModalEntityId: '',
      adjustModalFriendlyName: '',
      adjustModalResumeAt: '',
      adjustModalEntityIds: [],
      adjustModalFriendlyNames: [],
    });
  });
});
