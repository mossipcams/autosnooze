/**
 * AutoSnooze Automation List child component.
 * Renders filter tabs, search input, selection actions, and grouped/flat automation list.
 * Fires selection-change events instead of directly modifying parent state.
 */

import { LitElement, html, TemplateResult, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { automationListStyles } from '../styles/automation-list.styles.js';
import { localize } from '../localization/localize.js';
import { UI_TIMING } from '../constants/index.js';
import { hapticFeedback } from '../utils/haptic.js';
import {
  buildAutomationListViewModel,
  getAreaName,
  getLabelName,
  getCategoryName,
  loadHideSnoozedPreference,
  saveHideSnoozedPreference,
  trackSelectionFeatureUsed,
  trackFilterTabSelected,
  trackHideSnoozedToggled,
  type AutomationListViewModel,
} from '../features/automation-list/index.js';
import type { HomeAssistant, HassLabel, HassCategory } from '../types/hass.js';
import type { AutomationItem } from '../types/automation.js';
import type { FilterTab } from '../types/card.js';
import { defineAutoSnoozeElement } from '../utils/custom-element-registration.js';

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

  @property({ attribute: false })
  recentSnoozeIds: string[] = [];

  @property({ attribute: false })
  pausedEntityIds: string[] = [];

  @state() _filterTab: FilterTab = 'all';
  @state() _search: string = '';
  @state() _searchInput: string = '';
  @state() _expandedGroups: Record<string, boolean> = {};
  @state() _hideSnoozed: boolean = false;

  private _searchTimeout: number | null = null;
  private _viewModelCache: {
    automations: AutomationItem[];
    search: string;
    filterTab: FilterTab;
    hass: HomeAssistant | undefined;
    labelRegistry: Record<string, HassLabel>;
    categoryRegistry: Record<string, HassCategory>;
    hideSnoozed: boolean;
    pausedEntityIds: string[];
    result: AutomationListViewModel;
  } | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this._hideSnoozed = loadHideSnoozedPreference();
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (
      this._hideSnoozed &&
      (changedProps.has('pausedEntityIds') || changedProps.has('selected') || changedProps.has('_hideSnoozed'))
    ) {
      this._pruneHiddenSelection();
    }
  }

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
    const expanded = this._expandedGroups[group] !== false;
    this._expandedGroups = {
      ...this._expandedGroups,
      [group]: !expanded,
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
    const allIds = this._getViewModel().filtered.map((a) => a.id);
    const newSelected = [...new Set([...this.selected, ...allIds])];
    if (this.hass) {
      trackSelectionFeatureUsed(this.hass, allIds.length);
    }
    this._fireSelectionChange(newSelected);
  }

  private _clearSelection(): void {
    this._fireSelectionChange([]);
  }

  _getFilteredAutomations(): AutomationItem[] {
    return this._getViewModel().filtered;
  }

  _getAreaName(areaId: string | null | undefined): string {
    if (!this.hass) return localize(this.hass, 'group.unassigned');
    return getAreaName(areaId ?? null, this.hass);
  }

  _getLabelName(labelId: string): string {
    return getLabelName(labelId, this.labelRegistry);
  }

  _getCategoryName(categoryId: string | null | undefined): string {
    return getCategoryName(categoryId ?? null, this.categoryRegistry);
  }

  private _getGroupedByTab(filterTab: 'areas' | 'labels' | 'categories'): [string, AutomationItem[]][] {
    return buildAutomationListViewModel(this._buildViewModelInput(filterTab)).grouped;
  }

  private _getGroupedByArea(): [string, AutomationItem[]][] {
    return this._getGroupedByTab('areas');
  }

  private _getGroupedByLabel(): [string, AutomationItem[]][] {
    return this._getGroupedByTab('labels');
  }

  private _getGroupedByCategory(): [string, AutomationItem[]][] {
    return this._getGroupedByTab('categories');
  }

  _getAreaCount(): number {
    return this._getViewModel().areaCount;
  }

  _getLabelCount(): number {
    return this._getViewModel().labelCount;
  }

  _getCategoryCount(): number {
    return this._getViewModel().categoryCount;
  }

  private _buildViewModelInput(filterTab: FilterTab) {
    return {
      automations: this.automations,
      search: this._search,
      filterTab,
      hass: this.hass,
      labelRegistry: this.labelRegistry,
      categoryRegistry: this.categoryRegistry,
      emptyAreaLabel: localize(this.hass, 'group.unassigned'),
      emptyLabelLabel: localize(this.hass, 'group.unlabeled'),
      emptyCategoryLabel: localize(this.hass, 'group.uncategorized'),
      hideSnoozed: this._hideSnoozed,
      pausedEntityIds: new Set(this.pausedEntityIds),
    };
  }

  private _getViewModel(): AutomationListViewModel {
    const cache = this._viewModelCache;
    if (
      cache &&
      cache.automations === this.automations &&
      cache.search === this._search &&
      cache.filterTab === this._filterTab &&
      cache.hass === this.hass &&
      cache.labelRegistry === this.labelRegistry &&
      cache.categoryRegistry === this.categoryRegistry &&
      cache.hideSnoozed === this._hideSnoozed &&
      cache.pausedEntityIds === this.pausedEntityIds
    ) {
      return cache.result;
    }

    const result = buildAutomationListViewModel(this._buildViewModelInput(this._filterTab));

    this._viewModelCache = {
      automations: this.automations,
      search: this._search,
      filterTab: this._filterTab,
      hass: this.hass,
      labelRegistry: this.labelRegistry,
      categoryRegistry: this.categoryRegistry,
      hideSnoozed: this._hideSnoozed,
      pausedEntityIds: this.pausedEntityIds,
      result,
    };

    return result;
  }

  private _pruneHiddenSelection(): void {
    if (!this._hideSnoozed || this.pausedEntityIds.length === 0 || this.selected.length === 0) {
      return;
    }

    const paused = new Set(this.pausedEntityIds);
    const nextSelected = this.selected.filter((id) => !paused.has(id));
    if (nextSelected.length !== this.selected.length) {
      this._fireSelectionChange(nextSelected);
    }
  }

  private _toggleHideSnoozed(): void {
    const hideSnoozed = !this._hideSnoozed;
    this._hideSnoozed = hideSnoozed;
    saveHideSnoozedPreference(hideSnoozed);
    if (this.hass) {
      trackHideSnoozedToggled(this.hass, hideSnoozed);
    }
    if (hideSnoozed) {
      this._pruneHiddenSelection();
    }
  }

  private _selectFilterTab(tab: FilterTab): void {
    this._filterTab = tab;
    if (this.hass) {
      trackFilterTabSelected(this.hass, tab);
    }
  }

  _handleSearchInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    this._searchInput = value;

    if (this._searchTimeout !== null) {
      clearTimeout(this._searchTimeout);
    }

    this._searchTimeout = window.setTimeout(() => {
      this._search = value;
      this._searchTimeout = null;
    }, UI_TIMING.SEARCH_DEBOUNCE_MS);
  }

  private _clearSearch(): void {
    if (this._searchTimeout !== null) {
      clearTimeout(this._searchTimeout);
      this._searchTimeout = null;
    }
    this._searchInput = '';
    this._search = '';
  }

  private _handleSearchKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Escape') return;
    if (!this._searchInput && !this._search) return;
    e.preventDefault();
    this._clearSearch();
  }

  private _renderSelectionList(
    viewModel: AutomationListViewModel,
    selectedIds: Set<string>
  ): TemplateResult | TemplateResult[] {
    const { filtered, grouped } = viewModel;

    if (this._filterTab === 'all') {
      if (filtered.length === 0) {
        return html`<div class="list-empty" role="status">${localize(this.hass, 'list.empty')}</div>`;
      }
      const recentIds = new Set(this.recentSnoozeIds);
      const recentItems: AutomationItem[] = [];
      const otherItems: AutomationItem[] = [];
      for (const item of filtered) {
        (recentIds.has(item.id) ? recentItems : otherItems).push(item);
      }
      const ordered = recentItems.concat(otherItems);
      return html`
        ${recentItems.length > 0 ? html`
          <div class="recent-group-header">
            <ha-icon icon="mdi:history" aria-hidden="true"></ha-icon>
            <span>${localize(this.hass, 'group.recent')}</span>
          </div>
        ` : ''}
        ${ordered.map((a, index) => html`
        <button
          type="button"
          class="list-item ${selectedIds.has(a.id) ? 'selected' : ''} ${index < recentItems.length ? 'is-recent' : ''}"
          data-entity-id=${a.id}
          @click=${() => this._toggleSelection(a.id)}
          role="option"
          aria-selected=${selectedIds.has(a.id)}
        >
          <input
            type="checkbox"
            .checked=${selectedIds.has(a.id)}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${() => this._toggleSelection(a.id)}
            aria-label="${localize(this.hass, 'a11y.select_automation', { name: a.name })}"
            tabindex="-1"
          />
          <div class="list-item-content">
            <div class="list-item-name">${a.name}</div>
          </div>
        </button>
      `)}
      `;
    }

    if (grouped.length === 0) {
      return html`<div class="list-empty" role="status">${localize(this.hass, 'list.empty')}</div>`;
    }

    return grouped.map(([groupName, items]) => {
      const expanded = this._expandedGroups[groupName] !== false;
      const groupSelected = items.every((i) => selectedIds.has(i.id));
      const someSelected = items.some((i) => selectedIds.has(i.id)) && !groupSelected;

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
                  class="list-item ${selectedIds.has(a.id) ? 'selected' : ''}"
                  data-entity-id=${a.id}
                  @click=${() => this._toggleSelection(a.id)}
                  role="option"
                  aria-selected=${selectedIds.has(a.id)}
                >
                  <input
                    type="checkbox"
                    .checked=${selectedIds.has(a.id)}
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
    const viewModel = this._getViewModel();
    const { filtered } = viewModel;
    const selectedIds = new Set(this.selected);
    const showRegistryWarning = this.labelRegistryUnavailable;
    const hasSearchValue = this._searchInput.length > 0 || this._search.length > 0;
    const allVisibleSelected =
      filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));
    return html`
      <div class="filter-row">
      <div class="filter-tabs" role="tablist" aria-label="${localize(this.hass, 'a11y.filter_tabs')}">
        <button
          type="button"
          class="tab ${this._filterTab === 'all' ? 'active' : ''}"
          @click=${() => this._selectFilterTab('all')}
          role="tab"
          aria-selected=${this._filterTab === 'all'}
          aria-controls="selection-list"
        >
          ${localize(this.hass, 'tab.all')}
          <span class="tab-count" aria-label="${localize(this.hass, 'a11y.automation_count', { count: viewModel.filtered.length })}">${viewModel.filtered.length}</span>
        </button>
        <button
          type="button"
          class="tab ${this._filterTab === 'areas' ? 'active' : ''}"
          @click=${() => this._selectFilterTab('areas')}
          role="tab"
          aria-selected=${this._filterTab === 'areas'}
          aria-controls="selection-list"
        >
          ${localize(this.hass, 'tab.areas')}
          <span class="tab-count" aria-label="${localize(this.hass, 'a11y.area_count', { count: viewModel.areaCount })}">${viewModel.areaCount}</span>
        </button>
        <button
          type="button"
          class="tab ${this._filterTab === 'categories' ? 'active' : ''}"
          @click=${() => this._selectFilterTab('categories')}
          role="tab"
          aria-selected=${this._filterTab === 'categories'}
          aria-controls="selection-list"
        >
          ${localize(this.hass, 'tab.categories')}
          <span class="tab-count" aria-label="${localize(this.hass, 'a11y.category_count', { count: viewModel.categoryCount })}">${viewModel.categoryCount}</span>
        </button>
        <button
          type="button"
          class="tab ${this._filterTab === 'labels' ? 'active' : ''}"
          @click=${() => this._selectFilterTab('labels')}
          role="tab"
          aria-selected=${this._filterTab === 'labels'}
          aria-controls="selection-list"
        >
          ${localize(this.hass, 'tab.labels')}
          <span class="tab-count" aria-label="${localize(this.hass, 'a11y.label_count', { count: viewModel.labelCount })}">${viewModel.labelCount}</span>
        </button>
        </div>
        <button
          type="button"
          class="hide-snoozed-toggle ${this._hideSnoozed ? 'active' : ''}"
          @click=${() => this._toggleHideSnoozed()}
          aria-pressed=${this._hideSnoozed}
          aria-label="${localize(this.hass, 'a11y.hide_snoozed')}"
          title="${localize(this.hass, 'filter.hide_snoozed')}"
        >
          <ha-icon icon=${this._hideSnoozed ? 'mdi:eye-off' : 'mdi:eye'} aria-hidden="true"></ha-icon>
        </button>
      </div>

      <div class="search-row selection-actions">
        <div class="search-box">
          <input
            type="search"
            size="1"
            placeholder="${localize(this.hass, 'search.placeholder')}"
            .value=${this._searchInput || this._search}
            @input=${(e: Event) => this._handleSearchInput(e)}
            @keydown=${(e: KeyboardEvent) => this._handleSearchKeydown(e)}
            aria-label="${localize(this.hass, 'a11y.search')}"
          />
          ${hasSearchValue
            ? html`
                <button
                  type="button"
                  class="search-clear-btn"
                  @click=${() => this._clearSearch()}
                  aria-label="${localize(this.hass, 'a11y.clear_search')}"
                >
                  ${localize(this.hass, 'button.clear')}
                </button>
              `
            : ''}
        </div>

        ${filtered.length > 0
          ? html`
              <span
                class="selection-count"
                role="status"
                aria-live="polite"
                data-short="${this.selected.length}/${filtered.length}"
              >
                <span class="selection-count-full">${localize(this.hass, 'selection.count', { selected: this.selected.length, total: filtered.length })}</span>
              </span>
              ${!allVisibleSelected
                ? html`
                    <button
                      type="button"
                      class="select-all-btn"
                      @click=${() => this._selectAllVisible()}
                      aria-label="${localize(this.hass, 'a11y.select_all')}"
                    >
                      ${localize(this.hass, 'button.select_all')}
                    </button>
                  `
                : ''}
              ${this.selected.length > 0
                ? html`<button type="button" class="select-all-btn clear-selection-btn" @click=${() => this._clearSelection()} aria-label="${localize(this.hass, 'a11y.clear_selection')}">${localize(this.hass, 'button.clear')}</button>`
                : ''}
            `
          : ''}
      </div>

      ${showRegistryWarning
        ? html`
            <div class="registry-warning" role="status">
              ${localize(this.hass, 'list.label_registry_warning')}
            </div>
          `
        : ''}

      <div class="selection-list" id="selection-list" role="listbox" aria-label="${localize(this.hass, 'a11y.automations_list')}" aria-multiselectable="true">
        ${this._renderSelectionList(viewModel, selectedIds)}
      </div>
    `;
  }
}

defineAutoSnoozeElement('autosnooze-automation-list', AutoSnoozeAutomationList);
