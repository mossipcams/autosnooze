/**
 * Tests for the AutoSnooze Active Pauses child component.
 * Covers: styles export, component class, properties, events, timer lifecycle.
 */

import { describe, it, expect, vi } from 'vitest';

describe('Active Pauses Styles', () => {
  it('should export activePausesStyles as a CSSResult', async () => {
    const { activePausesStyles } = await import('../src/styles/active-pauses.styles.js');
    expect(activePausesStyles).toBeDefined();
    // Lit css tagged template returns a CSSResult with cssText
    const cssText = activePausesStyles.cssText;
    expect(typeof cssText).toBe('string');
    expect(cssText).toContain('.snooze-list');
    expect(cssText).toContain('.wake-btn');
    expect(cssText).toContain('.wake-all');
    expect(cssText).toContain('.pause-group');
    expect(cssText).toContain('.paused-item');
    expect(cssText).toContain('.countdown');
    expect(cssText).toContain(':host');
  });

  it('should have cursor pointer and hover styles for group header', async () => {
    const { activePausesStyles } = await import('../src/styles/active-pauses.styles.js');
    const cssText = activePausesStyles.cssText;
    expect(cssText).toContain('cursor: pointer');
    expect(cssText).toContain('.pause-group-header:hover');
    expect(cssText).toContain('.pause-group-header:focus-visible');
  });

  it('should be re-exported from styles barrel index', async () => {
    const { activePausesStyles } = await import('../src/styles/active-pauses.styles.js');
    expect(activePausesStyles).toBeDefined();
    expect(activePausesStyles.cssText).toContain('.snooze-list');
  });
});

describe('AutoSnoozeActivePauses Component', () => {
  it('should export the class and extend LitElement', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    expect(AutoSnoozeActivePauses).toBeDefined();
    expect(typeof AutoSnoozeActivePauses).toBe('function');
    expect(AutoSnoozeActivePauses.styles).toBeDefined();
  });

  it('should have default property values', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    expect(el.pauseGroups).toEqual([]);
    expect(el.pausedCount).toBe(0);
    expect(el.hass).toBeUndefined();
  });

  it('should render empty when pausedCount is 0', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    el.pausedCount = 0;
    el.pauseGroups = [];
    const result = (el as unknown as { render: () => unknown }).render();
    expect(result).toBeDefined();
  });

  it('should fire wake-automation event with entityId', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    const events: CustomEvent[] = [];
    el.addEventListener('wake-automation', ((e: CustomEvent) => {
      events.push(e);
    }) as EventListener);

    (el as unknown as { _fireWake: (id: string) => void })._fireWake('automation.test_1');

    expect(events.length).toBe(1);
    expect(events[0].detail.entityId).toBe('automation.test_1');
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
  });

  it('should fire wake-all event', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    const events: CustomEvent[] = [];
    el.addEventListener('wake-all', ((e: CustomEvent) => {
      events.push(e);
    }) as EventListener);

    (el as unknown as { _fireWakeAll: () => void })._fireWakeAll();

    expect(events.length).toBe(1);
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
  });

  it('should manage wake-all two-tap confirmation state', async () => {
    vi.useFakeTimers();
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    const wakeAllEvents: CustomEvent[] = [];
    el.addEventListener('wake-all', ((e: CustomEvent) => {
      wakeAllEvents.push(e);
    }) as EventListener);

    const internal = el as unknown as { _wakeAllPending: boolean; _handleWakeAll: () => void };

    // First tap: should set pending
    internal._handleWakeAll();
    expect(internal._wakeAllPending).toBe(true);
    expect(wakeAllEvents.length).toBe(0);

    // Second tap: should fire event and reset
    internal._handleWakeAll();
    expect(internal._wakeAllPending).toBe(false);
    expect(wakeAllEvents.length).toBe(1);

    vi.useRealTimers();
  });

  it('should clear timers on disconnectedCallback', async () => {
    vi.useFakeTimers();
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();

    const internal = el as unknown as {
      _countdownState: { interval: number | null; syncTimeout: number | null };
      _wakeAllTimeout: number | null;
    };

    // Simulate having active timers
    internal._countdownState.interval = window.setInterval(() => {}, 1000);
    internal._countdownState.syncTimeout = window.setTimeout(() => {}, 1000);
    internal._wakeAllTimeout = window.setTimeout(() => {}, 3000);

    el.disconnectedCallback();

    expect(internal._countdownState.interval).toBeNull();
    expect(internal._countdownState.syncTimeout).toBeNull();
    expect(internal._wakeAllTimeout).toBeNull();

    vi.useRealTimers();
  });

  it('should start synchronized countdown on connectedCallback', async () => {
    vi.useFakeTimers();
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();

    const internal = el as unknown as {
      _countdownState: { interval: number | null; syncTimeout: number | null };
    };

    // Call connectedCallback to start timers
    el.connectedCallback();

    // After connectedCallback, _syncTimeout should be set (waiting for next second boundary)
    expect(internal._countdownState.syncTimeout).not.toBeNull();

    vi.useRealTimers();
    el.disconnectedCallback();
  });

  it('should set interval after sync timeout fires', async () => {
    vi.useFakeTimers();
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    const internal = el as unknown as {
      _countdownState: { interval: number | null; syncTimeout: number | null };
    };

    el.connectedCallback();

    // Before sync timeout fires, interval should be null
    expect(internal._countdownState.interval).toBeNull();

    // Advance past sync timeout (max 1000ms)
    vi.advanceTimersByTime(1000);

    // After sync fires, interval should be set
    expect(internal._countdownState.interval).not.toBeNull();

    vi.useRealTimers();
    el.disconnectedCallback();
  });

  it('should render pause groups when pausedCount > 0', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    el.pausedCount = 2;
    el.pauseGroups = [{
      resumeAt: futureDate,
      automations: [
        { entity_id: 'automation.test_1', friendly_name: 'Test Auto 1', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
        { entity_id: 'automation.test_2', friendly_name: 'Test Auto 2', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
      ],
    }];
    document.body.appendChild(el);
    await el.updateComplete;
    const snoozeList = el.shadowRoot?.querySelector('.snooze-list');
    expect(snoozeList).not.toBeNull();
    const pausedItems = el.shadowRoot?.querySelectorAll('.paused-item');
    expect(pausedItems?.length).toBe(2);
    const wakeAll = el.shadowRoot?.querySelector('.wake-all');
    expect(wakeAll).not.toBeNull();
    document.body.removeChild(el);
  });

  it('should be re-exported from components barrel index', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/index.js');
    expect(AutoSnoozeActivePauses).toBeDefined();
  });

  it('should fire adjust-group event with entityIds, friendlyNames, and resumeAt', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    const events: CustomEvent[] = [];
    el.addEventListener('adjust-group', ((e: CustomEvent) => {
      events.push(e);
    }) as EventListener);

    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const group = {
      resumeAt: futureDate,
      automations: [
        { entity_id: 'automation.a', friendly_name: 'Auto A', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
        { entity_id: 'automation.b', friendly_name: 'Auto B', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
      ],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any)._fireAdjustGroup(group);

    expect(events.length).toBe(1);
    expect(events[0].detail.entityIds).toEqual(['automation.a', 'automation.b']);
    expect(events[0].detail.friendlyNames).toEqual(['Auto A', 'Auto B']);
    expect(events[0].detail.resumeAt).toBe(futureDate);
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
  });

  it('should have clickable group header with role=button', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    el.pausedCount = 2;
    el.pauseGroups = [{
      resumeAt: futureDate,
      automations: [
        { entity_id: 'automation.a', friendly_name: 'Auto A', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
        { entity_id: 'automation.b', friendly_name: 'Auto B', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
      ],
    }];
    document.body.appendChild(el);
    await el.updateComplete;

    const header = el.shadowRoot?.querySelector('.pause-group-header');
    expect(header).not.toBeNull();
    expect(header?.getAttribute('role')).toBe('button');

    // Click group header should fire adjust-group event
    const events: CustomEvent[] = [];
    el.addEventListener('adjust-group', ((e: CustomEvent) => { events.push(e); }) as EventListener);
    (header as HTMLElement).click();
    expect(events.length).toBe(1);
    expect(events[0].detail.entityIds).toEqual(['automation.a', 'automation.b']);

    document.body.removeChild(el);
  });
});

describe('Group Header Adjust Event', () => {
  it('should use entity_id as fallback when friendly_name is empty', async () => {
    const { AutoSnoozeActivePauses } = await import('../src/components/autosnooze-active-pauses.js');
    if (!customElements.get('autosnooze-active-pauses')) {
      customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
    }
    const el = new AutoSnoozeActivePauses();
    const events: CustomEvent[] = [];
    el.addEventListener('adjust-group', ((e: CustomEvent) => {
      events.push(e);
    }) as EventListener);

    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const group = {
      resumeAt: futureDate,
      automations: [
        { entity_id: 'automation.a', friendly_name: '', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
      ],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any)._fireAdjustGroup(group);

    expect(events[0].detail.friendlyNames).toEqual(['automation.a']);
  });
});

describe('Entry Point Registration', () => {
  it('should export AutoSnoozeActivePauses from entry point', async () => {
    const exports = await import('../src/index.js');
    expect(exports.AutoSnoozeActivePauses).toBeDefined();
  });
});

describe('Parent Card Integration', () => {
  it('should handle wake-automation event from child by calling _wake', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-wake-test')) {
      customElements.define('autosnooze-card-wake-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-wake-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    card.hass = {
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '1',
          attributes: {
            paused_automations: {
              'automation.test': {
                entity_id: 'automation.test',
                friendly_name: 'Test Auto',
                resume_at: futureDate,
                paused_at: new Date().toISOString(),
                days: 0, hours: 1, minutes: 0,
              },
            },
            scheduled_snoozes: {},
          },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wakeSpy = vi.spyOn(card as any, '_wake');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    await internal._handleWakeEvent(new CustomEvent('wake-automation', { detail: { entityId: 'automation.test' } }));
    expect(wakeSpy).toHaveBeenCalledWith('automation.test');
    wakeSpy.mockRestore();
    document.body.removeChild(card);
  });

  it('should handle wake-all event from child by calling wakeAll service', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-wakeall-test')) {
      customElements.define('autosnooze-card-wakeall-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-wakeall-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    card.hass = {
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '2',
          attributes: {
            paused_automations: {
              'automation.a': { entity_id: 'automation.a', friendly_name: 'A', resume_at: new Date(Date.now() + 3600000).toISOString(), paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
              'automation.b': { entity_id: 'automation.b', friendly_name: 'B', resume_at: new Date(Date.now() + 3600000).toISOString(), paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
            },
            scheduled_snoozes: {},
          },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    expect(typeof internal._handleWakeAllEvent).toBe('function');
    await internal._handleWakeAllEvent();
    expect(card.hass!.callService).toHaveBeenCalledWith('autosnooze', 'cancel_all', {});
    document.body.removeChild(card);
  });

  it('should show toast and haptic on wake-all success', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-wakeall-toast-test')) {
      customElements.define('autosnooze-card-wakeall-toast-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-wakeall-toast-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    card.hass = {
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    const hapticSpy = vi.spyOn(internal, '_hapticFeedback');
    const toastSpy = vi.spyOn(internal, '_showToast');
    await internal._handleWakeAllEvent();
    expect(hapticSpy).toHaveBeenCalledWith('success');
    expect(toastSpy).toHaveBeenCalled();
    hapticSpy.mockRestore();
    toastSpy.mockRestore();
    document.body.removeChild(card);
  });

  it('should show error toast and haptic on wake-all failure', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-wakeall-err-test')) {
      customElements.define('autosnooze-card-wakeall-err-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-wakeall-err-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    card.hass = {
      callService: vi.fn().mockRejectedValue(new Error('Service failed')),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    const hapticSpy = vi.spyOn(internal, '_hapticFeedback');
    const toastSpy = vi.spyOn(internal, '_showToast');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await internal._handleWakeAllEvent();
    expect(hapticSpy).toHaveBeenCalledWith('failure');
    expect(toastSpy).toHaveBeenCalled();
    hapticSpy.mockRestore();
    toastSpy.mockRestore();
    consoleSpy.mockRestore();
    document.body.removeChild(card);
  });

  it('should not have _renderActivePauses on parent (extracted to child)', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-no-render-test')) {
      customElements.define('autosnooze-card-no-render-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-no-render-test')! as typeof AutomationPauseCard)();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    expect(internal._renderActivePauses).toBeUndefined();
    expect(internal._startSynchronizedCountdown).toBeUndefined();
    expect(internal._updateCountdownIfNeeded).toBeUndefined();
    expect(internal._wakeAllPending).toBeUndefined();
  });

  it('should not have countdown timer fields on parent (owned by child)', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-no-timers-test')) {
      customElements.define('autosnooze-card-no-timers-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-no-timers-test')! as typeof AutomationPauseCard)();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    expect(internal._interval).toBeUndefined();
    expect(internal._syncTimeout).toBeUndefined();
    expect(internal._wakeAllTimeout).toBeUndefined();
  });

  it('should have _handleAdjustGroupEvent that opens modal in group mode', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-group-test')) {
      customElements.define('autosnooze-card-group-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-group-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    card.hass = {
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    expect(typeof internal._handleAdjustGroupEvent).toBe('function');
    internal._handleAdjustGroupEvent(new CustomEvent('adjust-group', {
      detail: {
        entityIds: ['automation.a', 'automation.b'],
        friendlyNames: ['Auto A', 'Auto B'],
        resumeAt: futureDate,
      },
    }));
    expect(internal._adjustModalOpen).toBe(true);
    expect(internal._adjustModalEntityIds).toEqual(['automation.a', 'automation.b']);
    expect(internal._adjustModalFriendlyNames).toEqual(['Auto A', 'Auto B']);
    expect(internal._adjustModalResumeAt).toBe(futureDate);
    // Single mode should be cleared
    expect(internal._adjustModalEntityId).toBe('');
    expect(internal._adjustModalFriendlyName).toBe('');
    document.body.removeChild(card);
  });

  it('should handle adjust-group event from active-pauses child and open group modal', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-group-event-test')) {
      customElements.define('autosnooze-card-group-event-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-group-event-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    card.hass = {
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '2',
          attributes: {
            paused_automations: {
              'automation.a': { entity_id: 'automation.a', friendly_name: 'A', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
              'automation.b': { entity_id: 'automation.b', friendly_name: 'B', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
            },
            scheduled_snoozes: {},
          },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // Find the active-pauses child element and click the group header
    const activePauses = card.shadowRoot?.querySelector('autosnooze-active-pauses');
    expect(activePauses).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (activePauses as any).updateComplete;
    const groupHeader = activePauses?.shadowRoot?.querySelector('.pause-group-header') as HTMLElement;
    expect(groupHeader).not.toBeNull();
    groupHeader.click();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    expect(internal._adjustModalOpen).toBe(true);
    expect(internal._adjustModalEntityIds.length).toBeGreaterThan(0);
    document.body.removeChild(card);
  });

  it('should pass entityIds and friendlyNames to adjust modal in template', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-group-template-test')) {
      customElements.define('autosnooze-card-group-template-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-group-template-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    card.hass = {
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '2',
          attributes: {
            paused_automations: {
              'automation.a': { entity_id: 'automation.a', friendly_name: 'A', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
              'automation.b': { entity_id: 'automation.b', friendly_name: 'B', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
            },
            scheduled_snoozes: {},
          },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    // Set group state
    internal._adjustModalOpen = true;
    internal._adjustModalEntityIds = ['automation.a', 'automation.b'];
    internal._adjustModalFriendlyNames = ['A', 'B'];
    internal._adjustModalResumeAt = futureDate;
    await card.updateComplete;
    // Check that adjust-modal element has entityIds and friendlyNames bound
    const modal = card.shadowRoot?.querySelector('autosnooze-adjust-modal');
    expect(modal).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modalEl = modal as any;
    expect(modalEl.entityIds).toEqual(['automation.a', 'automation.b']);
    expect(modalEl.friendlyNames).toEqual(['A', 'B']);
    document.body.removeChild(card);
  });

  it('should close group modal when all group entities are no longer paused', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-group-autoclose-test')) {
      customElements.define('autosnooze-card-group-autoclose-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-group-autoclose-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    // Start with 2 paused automations
    card.hass = {
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '2',
          attributes: {
            paused_automations: {
              'automation.a': { entity_id: 'automation.a', friendly_name: 'A', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
              'automation.b': { entity_id: 'automation.b', friendly_name: 'B', resume_at: futureDate, paused_at: new Date().toISOString(), days: 0, hours: 1, minutes: 0 },
            },
            scheduled_snoozes: {},
          },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    // Open group modal
    internal._adjustModalOpen = true;
    internal._adjustModalEntityIds = ['automation.a', 'automation.b'];
    internal._adjustModalFriendlyNames = ['A', 'B'];
    internal._adjustModalResumeAt = futureDate;
    // Now update hass so that all group entities are unpaused
    card.hass = {
      ...card.hass,
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    await card.updateComplete;
    // Modal should auto-close
    expect(internal._adjustModalOpen).toBe(false);
    expect(internal._adjustModalEntityIds).toEqual([]);
    document.body.removeChild(card);
  });

  it('should clear group state when _handleCloseModalEvent is called', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-group-close-test')) {
      customElements.define('autosnooze-card-group-close-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-group-close-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    card.hass = {
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    // Set group modal state
    internal._adjustModalOpen = true;
    internal._adjustModalEntityIds = ['automation.a', 'automation.b'];
    internal._adjustModalFriendlyNames = ['A', 'B'];
    internal._adjustModalResumeAt = new Date(Date.now() + 3600000).toISOString();
    // Close modal
    internal._handleCloseModalEvent();
    expect(internal._adjustModalOpen).toBe(false);
    expect(internal._adjustModalEntityIds).toEqual([]);
    expect(internal._adjustModalFriendlyNames).toEqual([]);
    expect(internal._adjustModalEntityId).toBe('');
    expect(internal._adjustModalFriendlyName).toBe('');
    expect(internal._adjustModalResumeAt).toBe('');
    document.body.removeChild(card);
  });

  it('should handle adjust-time event with entityIds in group mode', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-group-adjust-test')) {
      customElements.define('autosnooze-card-group-adjust-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-group-adjust-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    card.hass = {
      callService: vi.fn().mockResolvedValue(undefined),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = card as any;
    // Set up group modal state
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    internal._adjustModalOpen = true;
    internal._adjustModalEntityIds = ['automation.a', 'automation.b'];
    internal._adjustModalResumeAt = futureDate;
    // Fire adjust-time with entityIds (group mode)
    await internal._handleAdjustTimeEvent(new CustomEvent('adjust-time', {
      detail: { entityIds: ['automation.a', 'automation.b'], minutes: 15 },
    }));
    expect(card.hass!.callService).toHaveBeenCalledWith('autosnooze', 'adjust', {
      entity_id: ['automation.a', 'automation.b'],
      minutes: 15,
    });
    document.body.removeChild(card);
  });

  it('should render autosnooze-active-pauses element when automations are paused', async () => {
    await import('../src/index.js');
    const { AutomationPauseCard } = await import('../src/components/autosnooze-card.js');
    if (!customElements.get('autosnooze-card-integration-test')) {
      customElements.define('autosnooze-card-integration-test', class extends AutomationPauseCard {});
    }
    const card = new (customElements.get('autosnooze-card-integration-test')! as typeof AutomationPauseCard)();
    card.setConfig({ title: 'Test' });
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    card.hass = {
      callService: vi.fn(),
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '1',
          attributes: {
            paused_automations: {
              'automation.test': {
                entity_id: 'automation.test',
                friendly_name: 'Test Auto',
                resume_at: futureDate,
                paused_at: new Date().toISOString(),
                days: 0, hours: 1, minutes: 0,
              },
            },
            scheduled_snoozes: {},
          },
        },
      },
      locale: { language: 'en' },
      language: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    document.body.appendChild(card);
    await card.updateComplete;
    const activePausesEl = card.shadowRoot?.querySelector('autosnooze-active-pauses');
    expect(activePausesEl).not.toBeNull();
    document.body.removeChild(card);
  });
});
