// @ts-nocheck -- registry service contract tests
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  fetchCategoryRegistry,
  fetchEntityRegistry,
  fetchLabelRegistry,
  invalidateRegistryCaches,
} from '../src/services/registry.js';

describe('Registry Service', () => {
  let mockHass;
  let sendMessagePromise;

  beforeEach(() => {
    invalidateRegistryCaches();
    sendMessagePromise = vi.fn();
    mockHass = {
      connection: { sendMessagePromise },
    };
  });

  test('multiple_cards_share_one_registry_request', async () => {
    sendMessagePromise.mockResolvedValue([{ label_id: 'a', name: 'A' }]);

    const [first, second] = await Promise.all([
      fetchLabelRegistry(mockHass),
      fetchLabelRegistry(mockHass),
    ]);

    expect(first).toBe(second);
    expect(sendMessagePromise).toHaveBeenCalledTimes(1);
  });

  test('registry_cache_invalidates_and_retries_after_failure', async () => {
    sendMessagePromise
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([{ label_id: 'b', name: 'B' }]);

    const failed = await fetchLabelRegistry(mockHass);
    expect(failed).toBeNull();

    const recovered = await fetchLabelRegistry(mockHass);

    expect(recovered).toEqual({ b: { label_id: 'b', name: 'B' } });
    expect(sendMessagePromise).toHaveBeenCalledTimes(2);

    invalidateRegistryCaches(mockHass);
    sendMessagePromise.mockResolvedValueOnce([{ label_id: 'c', name: 'C' }]);

    const refreshed = await fetchLabelRegistry(mockHass);
    expect(refreshed).toEqual({ c: { label_id: 'c', name: 'C' } });
    expect(sendMessagePromise).toHaveBeenCalledTimes(3);
  });

  test('category_and_entity_registry_requests_are_shared', async () => {
    sendMessagePromise
      .mockResolvedValueOnce([{ category_id: 'lighting', name: 'Lighting' }])
      .mockResolvedValueOnce([{ entity_id: 'automation.a', categories: {} }]);

    await Promise.all([fetchCategoryRegistry(mockHass), fetchCategoryRegistry(mockHass)]);
    await Promise.all([fetchEntityRegistry(mockHass), fetchEntityRegistry(mockHass)]);

    expect(sendMessagePromise).toHaveBeenCalledTimes(2);
  });
});
