/**
 * Shared test query helpers for AutoSnooze card testing.
 *
 * These helpers provide typed access to Shadow DOM child components
 * and computed automation state used across many test files.
 */

import type { AutomationItem } from '../../src/types/automation.js';

/**
 * Compute automation items from card state (hass, entity registry, etc).
 */
export function computeAutomations(card: any): AutomationItem[] {
  const states = card.hass?.states || {};
  const entityReg = card._entityRegistry || {};
  const hassEntities = card.hass?.entities || {};
  return Object.entries(states)
    .filter(([id, state]: [string, any]) => id.startsWith('automation.') && state)
    .map(([id, state]: [string, any]) => {
      const reg = (entityReg as any)[id] || {};
      const hassEntry = (hassEntities as any)[id] || {};
      const categories = reg.categories || {};
      return {
        id,
        name: state.attributes?.friendly_name || id,
        area_id: reg.area_id ?? hassEntry.area_id ?? null,
        labels: reg.labels ?? hassEntry.labels ?? [],
        category_id: categories.automation ?? null,
      };
    })
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
}

/**
 * Query/create the automation-list child component with property syncing.
 */
export function queryAutomationList(card: any): any {
  // If card has rendered, find child in shadow DOM
  const sr = card.shadowRoot;
  if (sr) {
    const child = sr.querySelector('autosnooze-automation-list');
    if (child) {
      // Sync all properties from card to child (may not have re-rendered yet)
      if (card.hass) child.hass = card.hass;
      if (card._selected !== undefined) child.selected = card._selected;
      if (card._labelRegistry) child.labelRegistry = card._labelRegistry;
      if (card._categoryRegistry) child.categoryRegistry = card._categoryRegistry;
      // Recompute automations from card's current state (entity registry may have changed)
      child.automations = computeAutomations(card);
      return child;
    }
  }
  // For tests that access child methods without rendering:
  // Create a standalone automation list with synced data
  if (!card.__automationList) {
    const list: any = document.createElement('autosnooze-automation-list');
    // Listen for selection-change events on the element itself
    list.addEventListener('selection-change', (e: any) => {
      list.selected = e.detail.selected;
      card._selected = e.detail.selected;
    });
    card.__automationList = list;
  }
  const list = card.__automationList;
  // Sync state from card to child
  if (card.hass) list.hass = card.hass;
  list.automations = computeAutomations(card);
  list.selected = card._selected || [];
  list.labelRegistry = card._labelRegistry || {};
  list.categoryRegistry = card._categoryRegistry || {};
  return list;
}

/**
 * Query the active-pauses child component from card shadow DOM.
 */
export function queryActivePauses(card: any): any {
  return card.shadowRoot?.querySelector('autosnooze-active-pauses');
}

/**
 * Query inside the active-pauses child component's shadow DOM.
 */
export function queryInActivePauses(card: any, selector: string): any {
  const ap = queryActivePauses(card);
  return ap?.shadowRoot?.querySelector(selector);
}

/**
 * querySelectorAll inside the active-pauses child component's shadow DOM.
 */
export function queryAllInActivePauses(card: any, selector: string): any {
  const ap = queryActivePauses(card);
  return ap?.shadowRoot?.querySelectorAll(selector) || [];
}

/**
 * Query the duration-selector child component from card shadow DOM.
 */
export function queryDurationSelector(card: any): any {
  return card.shadowRoot?.querySelector('autosnooze-duration-selector');
}

/**
 * Query inside the duration-selector child component's shadow DOM.
 */
export function queryInDurationSelector(card: any, selector: string): any {
  const ds = queryDurationSelector(card);
  return ds?.shadowRoot?.querySelector(selector);
}

/**
 * querySelectorAll inside the duration-selector child component's shadow DOM.
 */
export function queryAllInDurationSelector(card: any, selector: string): any {
  const ds = queryDurationSelector(card);
  return ds?.shadowRoot?.querySelectorAll(selector) || [];
}
