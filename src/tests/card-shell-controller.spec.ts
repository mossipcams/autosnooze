import { describe, expect, test, vi } from 'vitest';
import { CardShellController } from '../features/card-shell/controller.js';
import type { HomeAssistant } from '../types/hass.js';

const hass = (states: Record<string, unknown> = {}) => ({
  states,
  connection: {},
}) as HomeAssistant;

describe('CardShellController', () => {
  test('isolates registry lifecycle, retries labels, and cancels pending work', async () => {
    const retry = vi.fn((_callback: () => void, _delay: number) => 1 as unknown as ReturnType<typeof setTimeout>);
    const clearRetry = vi.fn();
    const loadLabels = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ important: { label_id: 'important', name: 'Important' } });
    const first = new CardShellController(vi.fn(), {
      loadLabels,
      loadCategories: vi.fn().mockResolvedValue({}),
      loadEntities: vi.fn().mockResolvedValue({}),
      setTimeout: retry,
      clearTimeout: clearRetry,
    });
    const second = new CardShellController(vi.fn(), {
      loadLabels: vi.fn().mockResolvedValue({}),
      loadCategories: vi.fn().mockResolvedValue({}),
      loadEntities: vi.fn().mockResolvedValue({}),
      setTimeout: retry,
      clearTimeout: clearRetry,
    });

    await first.connect(hass());
    expect(first.snapshot).toMatchObject({ labelsUnavailable: true, cacheVersion: 1 });
    expect(second.snapshot).toMatchObject({ labelsUnavailable: false, cacheVersion: 0 });
    expect(retry).toHaveBeenCalledTimes(1);

    const retryCallback = retry.mock.calls[0][0] as () => void;
    retryCallback();
    await vi.waitFor(() => expect(first.snapshot.labels).toHaveProperty('important'));
    expect(first.snapshot).toMatchObject({ labelsUnavailable: false, cacheVersion: 2 });

    first.disconnect();
    expect(clearRetry).toHaveBeenCalled();
  });

  test('deduplicates loads and caches automations until states or registry changes', async () => {
    let resolveEntities!: (value: Record<string, never>) => void;
    const loadEntities = vi.fn(() => new Promise<Record<string, never>>((resolve) => {
      resolveEntities = resolve;
    }));
    const getAutomations = vi.fn(() => []);
    const controller = new CardShellController(vi.fn(), {
      loadLabels: vi.fn().mockResolvedValue({}),
      loadCategories: vi.fn().mockResolvedValue({}),
      loadEntities,
      getAutomations,
    });
    const currentHass = hass({});

    const first = controller.connect(currentHass);
    const second = controller.connect(currentHass);
    expect(loadEntities).toHaveBeenCalledTimes(1);
    resolveEntities({});
    await Promise.all([first, second]);

    expect(controller.getAutomations(currentHass)).toBe(controller.getAutomations(currentHass));
    expect(getAutomations).toHaveBeenCalledTimes(1);
    controller.getAutomations(hass({ 'automation.changed': {} }));
    expect(getAutomations).toHaveBeenCalledTimes(2);
    expect(controller.snapshot.cacheVersion).toBe(2);
  });

  test('detects only card-shell and automation state changes', () => {
    const controller = new CardShellController(vi.fn());
    const states = { 'automation.kitchen': { state: 'on' }, 'light.kitchen': { state: 'on' } };
    const current = hass(states as never);

    expect(controller.shouldUpdate(current, { ...current, states: states as never })).toBe(false);
    expect(controller.shouldUpdate(current, hass({ ...states, 'light.kitchen': { state: 'off' } } as never))).toBe(false);
    expect(controller.shouldUpdate(current, hass({ ...states, 'automation.kitchen': { state: 'off' } } as never))).toBe(true);
    expect(controller.shouldUpdate(current, hass({ ...states, 'automation.new': { state: 'on' } } as never))).toBe(true);
  });
});
