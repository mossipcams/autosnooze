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

  it('should be re-exported from styles barrel index', async () => {
    const { activePausesStyles } = await import('../src/styles/index.js');
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
      _interval: number | null;
      _syncTimeout: number | null;
      _wakeAllTimeout: number | null;
    };

    // Simulate having active timers
    internal._interval = window.setInterval(() => {}, 1000);
    internal._syncTimeout = window.setTimeout(() => {}, 1000);
    internal._wakeAllTimeout = window.setTimeout(() => {}, 3000);

    el.disconnectedCallback();

    expect(internal._interval).toBeNull();
    expect(internal._syncTimeout).toBeNull();
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
      _syncTimeout: number | null;
      _interval: number | null;
      _startSynchronizedCountdown: () => void;
    };

    // Call connectedCallback to start timers
    el.connectedCallback();

    // After connectedCallback, _syncTimeout should be set (waiting for next second boundary)
    expect(internal._syncTimeout).not.toBeNull();

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
      _syncTimeout: number | null;
      _interval: number | null;
    };

    el.connectedCallback();

    // Before sync timeout fires, interval should be null
    expect(internal._interval).toBeNull();

    // Advance past sync timeout (max 1000ms)
    vi.advanceTimersByTime(1000);

    // After sync fires, interval should be set
    expect(internal._interval).not.toBeNull();

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
