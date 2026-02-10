/**
 * AutoSnooze Automation List child component.
 * Renders filter tabs, search input, selection actions, and grouped/flat automation list.
 * Fires selection-change events instead of directly modifying parent state.
 */

import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { automationListStyles } from '../styles/automation-list.styles.js';
import { localize } from '../localization/localize.js';
import { hapticFeedback } from '../utils/index.js';
import { UI_TIMING, EXCLUDE_LABEL, INCLUDE_LABEL } from '../constants/index.js';
import {
  filterAutomations,
  groupAutomationsBy,
  getUniqueCount,
  getAreaName,
  getLabelName,
  getCategoryName,
} from '../state/automations.js';
import type { HomeAssistant, HassLabel, HassCategory } from '../types/hass.js';
import type { AutomationItem } from '../types/automation.js';
import type { FilterTab } from '../types/card.js';

export class AutoSnoozeAutomationList extends LitElement {
  static styles = automationListStyles;

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  automations: AutomationItem[] = [];

  @property({ attribute: false })
  selected: string[] = [];

  @property({ attribute: false })
  labelRegistry: Record<string, HassLabel> = {};

  @property({ type: Boolean })
  labelRegistryUnavailable: boolean = false;

  @property({ attribute: false })
  categoryRegistry: Record<string, HassCategory> = {};

  @state() _filterTab: FilterTab = 'all';
  @state() _search: string = '';
  @state() _expandedGroups: Record<string, boolean> = {};

  private _searchTimeout: number | null = null;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._searchTimeout !== null) {
      clearTimeout(this._searchTimeout);
      this._searchTimeout = null;
    }
  }

  private _fireSelectionChange(newSelected: string[]): void {
    this.dispatchEvent(new CustomEvent('selection-change', {
      detail: { selected: newSelected },
      bubbles: true,
      composed: true,
    }));
  }

  private _toggleSelection(id: string): void {
    hapticFeedback('selection');
    let newSelected: string[];
    if (this.selected.includes(id)) {
      newSelected = this.selected.filter((s) => s !== id);
    } else {
      newSelected = [...this.selected, id];
    }
    this._fireSelectionChange(newSelected);
  }

  private _toggleGroupExpansion(group: string): void {
    this._expandedGroups = {
      ...this._expandedGroups,
      [group]: !this._expandedGroups[group],
    };
  }

  private _selectGroup(items: AutomationItem[]): void {
    const ids = items.map((i) => i.id);
    const allSelected = ids.every((id) => this.selected.includes(id));
    let newSelected: string[];

    if (allSelected) {
      newSelected = this.selected.filter((id) => !ids.includes(id));
    } else {
      newSelected = [...new Set([...this.selected, ...ids])];
    }
    this._fireSelectionChange(newSelected);
  }

  private _selectAllVisible(): void {
    const filtered = this._getFilteredAutomations();
    const allIds = filtered.map((a) => a.id);
    const allSelected = allIds.every((id) => this.selected.includes(id));
    let newSelected: string[];

    if (allSelected) {
      newSelected = this.selected.filter((id) => !allIds.includes(id));
    } else {
      newSelected = [...new Set([...this.selected, ...allIds])];
    }
    this._fireSelectionChange(newSelected);
  }

  private _clearSelection(): void {
    this._fireSelectionChange([]);
  }

  _getFilteredAutomations(): AutomationItem[] {
    return filterAutomations(
      this.automations,
      this._search,
      this.labelRegistry,
      this.labelRegistryUnavailable,
    );
  }

  private _getAreaName(areaId: string | null): string {
    if (!this.hass) return localize(this.hass, 'group.unassigned');
    return getAreaName(areaId, this.hass);
  }

  private _getLabelName(labelId: string): string {
    return getLabelName(labelId, this.labelRegistry);
  }

  private _getCategoryName(categoryId: string | null): string {
    return getCategoryName(categoryId, this.categoryRegistry);
  }

  private _getGroupedByArea(): [string, AutomationItem[]][] {
    const automations = this._getFilteredAutomations();
    return groupAutomationsBy(
      automations,
      (auto) => auto.area_id ? [this._getAreaName(auto.area_id)] : null,
      localize(this.hass, 'group.unassigned')
    );
  }

  private _getGroupedByLabel(): [string, AutomationItem[]][] {
    const automations = this._getFilteredAutomations();
    const hiddenLabels = [EXCLUDE_LABEL.toLowerCase(), INCLUDE_LABEL.toLowerCase()];
    return groupAutomationsBy(
      automations,
      (auto) => {
        if (!auto.labels?.length) return null;
        const visibleLabels = auto.labels
          .map((id) => this._getLabelName(id))
          .filter((name) => !hiddenLabels.includes(name.toLowerCase()));
        return visibleLabels.length > 0 ? visibleLabels : null;
      },
      localize(this.hass, 'group.unlabeled')
    );
  }

  private _getGroupedByCategory(): [string, AutomationItem[]][] {
    const automations = this._getFilteredAutomations();
    return groupAutomationsBy(
      automations,
      (auto) => auto.category_id ? [this._getCategoryName(auto.category_id)] : null,
      localize(this.hass, 'group.uncategorized')
    );
  }

  _getAreaCount(): number {
    return getUniqueCount(this.automations, (auto) => auto.area_id ? [auto.area_id] : null);
  }

  _getLabelCount(): number {
    const hiddenLabels = [EXCLUDE_LABEL.toLowerCase(), INCLUDE_LABEL.toLowerCase()];
    return getUniqueCount(this.automations, (auto) => {
      if (!auto.labels?.length) return null;
      const visibleLabels = auto.labels.filter(
        (id) => !hiddenLabels.includes(this._getLabelName(id).toLowerCase())
      );
      return visibleLabels.length > 0 ? visibleLabels : null;
    });
  }

  _getCategoryCount(): number {
    return getUniqueCount(this.automations, (auto) => auto.category_id ? [auto.category_id] : null);
  }

  _handleSearchInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    const value = target.value;

    if (this._searchTimeout !== null) {
      clearTimeout(this._searchTimeout);
    }

    this._searchTimeout = window.setTimeout(() => {
      this._search = value;
      this._searchTimeout = null;
    }, UI_TIMING.SEARCH_DEBOUNCE_MS);
  }

  private _renderSelectionList(): TemplateResult | TemplateResult[] {
    const filtered = this._getFilteredAutomations();

    if (this._filterTab === 'all') {
      if (filtered.length === 0) {
        return html`<div class="list-empty" role="status">${localize(this.hass, 'list.empty')}</div>`;
      }
      return filtered.map((a) => html`
        <button
          type="button"
          class="list-item ${this.selected.includes(a.id) ? 'selected' : ''}"
          @click=${() => this._toggleSelection(a.id)}
          role="option"
          aria-selected=${this.selected.includes(a.id)}
        >
          <input
            type="checkbox"
            .checked=${this.selected.includes(a.id)}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${() => this._toggleSelection(a.id)}
            aria-label="${localize(this.hass, 'a11y.select_automation', { name: a.name })}"
            tabindex="-1"
          />
          <div class="list-item-content">
            <div class="list-item-name">${a.name}</div>
          </div>
        </button>
      `);
    }

    const grouped =
      this._filterTab === 'areas'
        ? this._getGroupedByArea()
        : this._filterTab === 'categories'
          ? this._getGroupedByCategory()
          : this._getGroupedByLabel();

    if (grouped.length === 0) {
      return html`<div class="list-empty" role="status">${localize(this.hass, 'list.empty')}</div>`;
    }

    return grouped.map(([groupName, items]) => {
      const expanded = this._expandedGroups[groupName] !== false;
      const groupSelected = items.every((i) => this.selected.includes(i.id));
      const someSelected = items.some((i) => this.selected.includes(i.id)) && !groupSelected;

      return html`
        <button
          type="button"
          class="group-header ${expanded ? 'expanded' : ''}"
          @click=${() => this._toggleGroupExpansion(groupName)}
          aria-expanded=${expanded}
          aria-label="${localize(this.hass, 'a11y.group_header', { name: groupName, count: items.length })}"
        >
          <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          <span>${groupName}</span>
          <span class="group-badge" aria-label="${localize(this.hass, 'a11y.group_count', { count: items.length })}">${items.length}</span>
          <input
            type="checkbox"
            .checked=${groupSelected}
            .indeterminate=${someSelected}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${() => this._selectGroup(items)}
            aria-label="${localize(this.hass, 'a11y.select_all_in_group', { name: groupName })}"
            tabindex="-1"
          />
        </button>
        ${expanded
          ? items.map((a) => html`
                <button
                  type="button"
                  class="list-item ${this.selected.includes(a.id) ? 'selected' : ''}"
                  @click=${() => this._toggleSelection(a.id)}
                  role="option"
                  aria-selected=${this.selected.includes(a.id)}
                >
                  <input
                    type="checkbox"
                    .checked=${this.selected.includes(a.id)}
                    @click=${(e: Event) => e.stopPropagation()}
                    @change=${() => this._toggleSelection(a.id)}
                    aria-label="${localize(this.hass, 'a11y.select_automation', { name: a.name })}"
                    tabindex="-1"
                  />
                  <div class="list-item-content">
                    <div class="list-item-name">${a.name}</div>
                  </div>
                </button>
              `)
          : ''}
      `;
    });
  }

  render(): TemplateResult {
    const filtered = this._getFilteredAutomations();
    return html`
      <div class="filter-tabs" role="tablist" aria-label="${localize(this.hass, 'a11y.filter_tabs')}">
        <button
          type="button"
          class="tab ${this._filterTab === 'all' ? 'active' : ''}"
          @click=${() => (this._filterTab = 'all')}
          role="tab"
          aria-selected=${this._filterTab === 'all'}
          aria-controls="selection-list"
        >
          ${localize(this.hass, 'tab.all')}
          <span class="tab-count" aria-label="${localize(this.hass, 'a11y.automation_count', { count: this.automations.length })}">${this.automations.length}</span>
        </button>
        <button
          type="button"
          class="tab ${this._filterTab === 'areas' ? 'active' : ''}"
          @click=${() => (this._filterTab = 'areas')}
          role="tab"
          aria-selected=${this._filterTab === 'areas'}
          aria-controls="selection-list"
        >
          ${localize(this.hass, 'tab.areas')}
          <span class="tab-count" aria-label="${localize(this.hass, 'a11y.area_count', { count: this._getAreaCount() })}">${this._getAreaCount()}</span>
        </button>
        <button
          type="button"
          class="tab ${this._filterTab === 'categories' ? 'active' : ''}"
          @click=${() => (this._filterTab = 'categories')}
          role="tab"
          aria-selected=${this._filterTab === 'categories'}
          aria-controls="selection-list"
        >
          ${localize(this.hass, 'tab.categories')}
          <span class="tab-count" aria-label="${localize(this.hass, 'a11y.category_count', { count: this._getCategoryCount() })}">${this._getCategoryCount()}</span>
        </button>
        <button
          type="button"
          class="tab ${this._filterTab === 'labels' ? 'active' : ''}"
          @click=${() => (this._filterTab = 'labels')}
          role="tab"
          aria-selected=${this._filterTab === 'labels'}
          aria-controls="selection-list"
        >
          ${localize(this.hass, 'tab.labels')}
          <span class="tab-count" aria-label="${localize(this.hass, 'a11y.label_count', { count: this._getLabelCount() })}">${this._getLabelCount()}</span>
        </button>
      </div>

      <div class="search-box">
        <input
          type="search"
          placeholder="${localize(this.hass, 'search.placeholder')}"
          .value=${this._search}
          @input=${(e: Event) => this._handleSearchInput(e)}
          aria-label="${localize(this.hass, 'a11y.search')}"
        />
      </div>

      ${filtered.length > 0
        ? html`
            <div class="selection-actions" role="toolbar" aria-label="${localize(this.hass, 'a11y.selection_actions')}">
              <span role="status" aria-live="polite">${localize(this.hass, 'selection.count', { selected: this.selected.length, total: filtered.length })}</span>
              <button
                type="button"
                class="select-all-btn"
                @click=${() => this._selectAllVisible()}
                aria-label="${filtered.every((a) => this.selected.includes(a.id))
                  ? localize(this.hass, 'a11y.deselect_all')
                  : localize(this.hass, 'a11y.select_all')}"
              >
                ${filtered.every((a) => this.selected.includes(a.id))
                  ? localize(this.hass, 'button.deselect_all')
                  : localize(this.hass, 'button.select_all')}
              </button>
              ${this.selected.length > 0
                ? html`<button type="button" class="select-all-btn" @click=${() => this._clearSelection()} aria-label="${localize(this.hass, 'a11y.clear_selection')}">${localize(this.hass, 'button.clear')}</button>`
                : ''}
            </div>
          `
        : ''}

      <div class="selection-list" id="selection-list" role="listbox" aria-label="${localize(this.hass, 'a11y.automations_list')}" aria-multiselectable="true">
        ${this._renderSelectionList()}
      </div>
    `;
  }
}
