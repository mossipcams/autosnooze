/**
 * Registry fetch services for AutoSnooze card.
 */

import type { HomeAssistant, HassLabel, HassCategory, HassEntityRegistryEntry } from '../types/hass.js';

interface RegistryCacheEntry<T> {
  promise: Promise<T>;
  value: T | null;
}

const labelRegistryCache = new Map<object, RegistryCacheEntry<Record<string, HassLabel> | null>>();
const categoryRegistryCache = new Map<object, RegistryCacheEntry<Record<string, HassCategory>>>();
const entityRegistryCache = new Map<object, RegistryCacheEntry<Record<string, HassEntityRegistryEntry>>>();

function getConnectionKey(hass: HomeAssistant): object {
  return hass.connection ?? hass;
}

export function invalidateRegistryCaches(hass?: HomeAssistant): void {
  if (!hass) {
    labelRegistryCache.clear();
    categoryRegistryCache.clear();
    entityRegistryCache.clear();
    return;
  }

  const key = getConnectionKey(hass);
  labelRegistryCache.delete(key);
  categoryRegistryCache.delete(key);
  entityRegistryCache.delete(key);
}

/**
 * Fetch the label registry from Home Assistant.
 */
export async function fetchLabelRegistry(
  hass: HomeAssistant
): Promise<Record<string, HassLabel> | null> {
  const key = getConnectionKey(hass);
  const cached = labelRegistryCache.get(key);
  if (cached) {
    return cached.promise;
  }

  const entry: RegistryCacheEntry<Record<string, HassLabel> | null> = {
    promise: Promise.resolve(null),
    value: null,
  };

  entry.promise = (async () => {
    try {
      const items = await hass.connection.sendMessagePromise<HassLabel[]>({
        type: 'config/label_registry/list',
      });

      const labelMap: Record<string, HassLabel> = {};
      if (Array.isArray(items)) {
        items.forEach((item) => {
          labelMap[item.label_id] = item;
        });
      }
      entry.value = labelMap;
      return labelMap;
    } catch (err) {
      console.warn('[AutoSnooze] Failed to fetch label registry:', err);
      entry.value = null;
      if (labelRegistryCache.get(key) === entry) {
        labelRegistryCache.delete(key);
      }
      return null;
    }
  })();

  labelRegistryCache.set(key, entry);
  return entry.promise;
}

/**
 * Fetch the category registry for automations from Home Assistant.
 */
export async function fetchCategoryRegistry(
  hass: HomeAssistant
): Promise<Record<string, HassCategory>> {
  const key = getConnectionKey(hass);
  const cached = categoryRegistryCache.get(key);
  if (cached) {
    return cached.promise;
  }

  const entry: RegistryCacheEntry<Record<string, HassCategory>> = {
    promise: Promise.resolve({}),
    value: {},
  };

  entry.promise = (async () => {
    try {
      const items = await hass.connection.sendMessagePromise<HassCategory[]>({
        type: 'config/category_registry/list',
        scope: 'automation',
      });

      const categoryMap: Record<string, HassCategory> = {};
      if (Array.isArray(items)) {
        items.forEach((item) => {
          categoryMap[item.category_id] = item;
        });
      }
      entry.value = categoryMap;
      return categoryMap;
    } catch (err) {
      console.warn('[AutoSnooze] Failed to fetch category registry:', err);
      entry.value = {};
      if (categoryRegistryCache.get(key) === entry) {
        categoryRegistryCache.delete(key);
      }
      return {};
    }
  })();

  categoryRegistryCache.set(key, entry);
  return entry.promise;
}

/**
 * Fetch the entity registry, filtered to automation entities.
 */
export async function fetchEntityRegistry(
  hass: HomeAssistant
): Promise<Record<string, HassEntityRegistryEntry>> {
  const key = getConnectionKey(hass);
  const cached = entityRegistryCache.get(key);
  if (cached) {
    return cached.promise;
  }

  const entry: RegistryCacheEntry<Record<string, HassEntityRegistryEntry>> = {
    promise: Promise.resolve({}),
    value: {},
  };

  entry.promise = (async () => {
    try {
      const items = await hass.connection.sendMessagePromise<HassEntityRegistryEntry[]>({
        type: 'config/entity_registry/list',
      });

      const entityMap: Record<string, HassEntityRegistryEntry> = {};
      if (Array.isArray(items)) {
        items
          .filter((e) => e.entity_id.startsWith('automation.'))
          .forEach((item) => {
            entityMap[item.entity_id] = item;
          });
      }
      entry.value = entityMap;
      return entityMap;
    } catch (err) {
      console.warn('[AutoSnooze] Failed to fetch entity registry:', err);
      entry.value = {};
      if (entityRegistryCache.get(key) === entry) {
        entityRegistryCache.delete(key);
      }
      return {};
    }
  })();

  entityRegistryCache.set(key, entry);
  return entry.promise;
}
