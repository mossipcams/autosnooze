/**
 * Registry fetch services for AutoSnooze card.
 */

import type { HomeAssistant, HassLabel, HassCategory, HassEntityRegistryEntry } from '../types/hass.js';

/**
 * Fetch the label registry from Home Assistant.
 */
export async function fetchLabelRegistry(
  hass: HomeAssistant
): Promise<Record<string, HassLabel>> {
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
    return labelMap;
  } catch (err) {
    console.warn('[AutoSnooze] Failed to fetch label registry:', err);
    return {};
  }
}

/**
 * Fetch the category registry for automations from Home Assistant.
 */
export async function fetchCategoryRegistry(
  hass: HomeAssistant
): Promise<Record<string, HassCategory>> {
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
    return categoryMap;
  } catch (err) {
    console.warn('[AutoSnooze] Failed to fetch category registry:', err);
    return {};
  }
}

/**
 * Fetch the entity registry, filtered to automation entities.
 */
export async function fetchEntityRegistry(
  hass: HomeAssistant
): Promise<Record<string, HassEntityRegistryEntry>> {
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
    return entityMap;
  } catch (err) {
    console.warn('[AutoSnooze] Failed to fetch entity registry:', err);
    return {};
  }
}
