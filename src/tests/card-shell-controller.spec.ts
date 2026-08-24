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

  test('does not cancel category retry when labels succeed after categories fail', async () => {
    const retry = vi.fn((_callback: () => void, _delay: number) => 1 as unknown as ReturnType<typeof setTimeout>);
    const clearRetry = vi.fn();
    let resolveLabels!: (value: Record<string, { label_id: string; name: string }>) => void;
    const loadLabels = vi.fn(() => new Promise<Record<string, { label_id: string; name: string }>>((resolve) => {
      resolveLabels = resolve;
    }));
    const loadCategories = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ lights: { category_id: 'lights', name: 'Lights' } });
    const controller = new CardShellController(vi.fn(), {
      loadLabels,
      loadCategories,
      loadEntities: vi.fn().mockResolvedValue({}),
      setTimeout: retry,
      clearTimeout: clearRetry,
    });

    const connectPromise = controller.connect(hass());
    await vi.waitFor(() => expect(retry).toHaveBeenCalledTimes(1));
    expect(loadCategories).toHaveBeenCalledTimes(1);
    expect(controller.snapshot.categories).toEqual({});

    resolveLabels({ important: { label_id: 'important', name: 'Important' } });
    await connectPromise;

    expect(clearRetry).not.toHaveBeenCalled();
    expect(retry).toHaveBeenCalledTimes(1);
    expect(controller.snapshot.labels).toHaveProperty('important');

    const retryCallback = retry.mock.calls[0][0] as () => void;
    retryCallback();
    await vi.waitFor(() => expect(controller.snapshot.categories).toHaveProperty('lights'));
    expect(loadCategories).toHaveBeenCalledTimes(2);
  });

  test('retries category registry after fetch failure', async () => {
    const retry = vi.fn((_callback: () => void, _delay: number) => 1 as unknown as ReturnType<typeof setTimeout>);
    const clearRetry = vi.fn();
    const loadCategories = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ lights: { category_id: 'lights', name: 'Lights' } });
    const controller = new CardShellController(vi.fn(), {
      loadLabels: vi.fn().mockResolvedValue({}),
      loadCategories,
      loadEntities: vi.fn().mockResolvedValue({}),
      setTimeout: retry,
      clearTimeout: clearRetry,
    });

    await controller.connect(hass());
    expect(controller.snapshot.categories).toEqual({});
    expect(retry).toHaveBeenCalledTimes(1);

    const retryCallback = retry.mock.calls[0][0] as () => void;
    retryCallback();
    await vi.waitFor(() => expect(controller.snapshot.categories).toHaveProperty('lights'));
    expect(loadCategories).toHaveBeenCalledTimes(2);
  });

  test('retries all failed registries from one shared retry timer', async () => {
    const retry = vi.fn((_callback: () => void, _delay: number) => 1 as unknown as ReturnType<typeof setTimeout>);
    const clearRetry = vi.fn();
    const loadLabels = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ important: { label_id: 'important', name: 'Important' } });
    const loadCategories = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ lights: { category_id: 'lights', name: 'Lights' } });
    const loadEntities = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ 'automation.kitchen': { entity_id: 'automation.kitchen', platform: 'automation' } });
    const controller = new CardShellController(vi.fn(), {
      loadLabels,
      loadCategories,
      loadEntities,
      setTimeout: retry,
      clearTimeout: clearRetry,
    });

    await controller.connect(hass());
    expect(controller.snapshot).toMatchObject({
      labelsUnavailable: true,
      labels: {},
      categories: {},
      entities: {},
    });
    expect(retry).toHaveBeenCalledTimes(1);
    expect(loadLabels).toHaveBeenCalledTimes(1);
    expect(loadCategories).toHaveBeenCalledTimes(1);
    expect(loadEntities).toHaveBeenCalledTimes(1);

    const retryCallback = retry.mock.calls[0][0] as () => void;
    retryCallback();
    await vi.waitFor(() => {
      expect(controller.snapshot.labels).toHaveProperty('important');
      expect(controller.snapshot.categories).toHaveProperty('lights');
      expect(controller.snapshot.entities).toHaveProperty('automation.kitchen');
    });
    expect(loadLabels).toHaveBeenCalledTimes(2);
    expect(loadCategories).toHaveBeenCalledTimes(2);
    expect(loadEntities).toHaveBeenCalledTimes(2);
    expect(controller.snapshot).toMatchObject({ labelsUnavailable: false });
  });

  test('retries entity registry after fetch failure', async () => {
    const retry = vi.fn((_callback: () => void, _delay: number) => 1 as unknown as ReturnType<typeof setTimeout>);
    const clearRetry = vi.fn();
    const loadEntities = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ 'automation.kitchen': { entity_id: 'automation.kitchen', platform: 'automation' } });
    const controller = new CardShellController(vi.fn(), {
      loadLabels: vi.fn().mockResolvedValue({}),
      loadCategories: vi.fn().mockResolvedValue({}),
      loadEntities,
      setTimeout: retry,
      clearTimeout: clearRetry,
    });

    await controller.connect(hass());
    expect(controller.snapshot.entities).toEqual({});
    expect(retry).toHaveBeenCalledTimes(1);

    const retryCallback = retry.mock.calls[0][0] as () => void;
    retryCallback();
    await vi.waitFor(() => expect(controller.snapshot.entities).toHaveProperty('automation.kitchen'));
    expect(loadEntities).toHaveBeenCalledTimes(2);
    expect(controller.snapshot.cacheVersion).toBeGreaterThan(0);
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

  test('input_boolean state changes do not force card refresh', () => {
    const controller = new CardShellController(vi.fn());
    const states = {
      'automation.kitchen': { state: 'on' },
      'input_boolean.away_mode': { state: 'on' },
    };
    const current = hass(states as never);

    expect(controller.shouldUpdate(current, hass({ ...states, 'input_boolean.away_mode': { state: 'off' } } as never))).toBe(false);
  });

  test('disconnect prevents pending registry retry from running', async () => {
    const retry = vi.fn((_callback: () => void, _delay: number) => 1 as unknown as ReturnType<typeof setTimeout>);
    const clearRetry = vi.fn();
    const loadCategories = vi.fn().mockResolvedValue(null);
    const controller = new CardShellController(vi.fn(), {
      loadLabels: vi.fn().mockResolvedValue({}),
      loadCategories,
      loadEntities: vi.fn().mockResolvedValue({}),
      setTimeout: retry,
      clearTimeout: clearRetry,
    });

    await controller.connect(hass());
    expect(retry).toHaveBeenCalledTimes(1);

    controller.disconnect();
    expect(clearRetry).toHaveBeenCalled();
    expect(loadCategories).toHaveBeenCalledTimes(1);
  });

  test('labels can succeed while categories and entities keep retrying', async () => {
    const retry = vi.fn((_callback: () => void, _delay: number) => 1 as unknown as ReturnType<typeof setTimeout>);
    const clearRetry = vi.fn();
    const loadLabels = vi.fn().mockResolvedValue({ important: { label_id: 'important', name: 'Important' } });
    const loadCategories = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ lights: { category_id: 'lights', name: 'Lights' } });
    const loadEntities = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ 'automation.kitchen': { entity_id: 'automation.kitchen', platform: 'automation' } });
    const controller = new CardShellController(vi.fn(), {
      loadLabels,
      loadCategories,
      loadEntities,
      setTimeout: retry,
      clearTimeout: clearRetry,
    });

    await controller.connect(hass());
    expect(controller.snapshot.labels).toHaveProperty('important');
    expect(controller.snapshot.categories).toEqual({});
    expect(controller.snapshot.entities).toEqual({});
    expect(retry).toHaveBeenCalledTimes(1);

    const retryCallback = retry.mock.calls[0][0] as () => void;
    retryCallback();
    await vi.waitFor(() => {
      expect(controller.snapshot.categories).toHaveProperty('lights');
      expect(controller.snapshot.entities).toHaveProperty('automation.kitchen');
    });
    expect(loadCategories).toHaveBeenCalledTimes(2);
    expect(loadEntities).toHaveBeenCalledTimes(2);
  });

  test('registry retry backoff doubles until the max delay', async () => {
    const delays: number[] = [];
    const retry = vi.fn((callback: () => void, delay: number) => {
      delays.push(delay);
      return 1 as unknown as ReturnType<typeof setTimeout>;
    });
    const clearRetry = vi.fn();
    const loadCategories = vi.fn().mockResolvedValue(null);
    const controller = new CardShellController(vi.fn(), {
      loadLabels: vi.fn().mockResolvedValue({}),
      loadCategories,
      loadEntities: vi.fn().mockResolvedValue({}),
      setTimeout: retry,
      clearTimeout: clearRetry,
    });

    await controller.connect(hass());
    const firstCallback = retry.mock.calls[0][0] as () => void;
    firstCallback();
    await Promise.resolve();
    const secondCallback = retry.mock.calls[1][0] as () => void;
    secondCallback();
    await Promise.resolve();

    expect(delays).toEqual([1000, 2000]);
  });
});
