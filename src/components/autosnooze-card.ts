/**
 * AutoSnooze Main Card Component.
 * A Lovelace card for temporarily pausing Home Assistant automations.
 */

import { LitElement, html, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localized } from '@lit/localize';
import { msg, str, initializeLocaleFromHA } from '../localization/localize.js';
import type { HomeAssistant, HassLabel, HassCategory, HassEntityRegistryEntry, HassEntities, ScheduledSnoozeAttribute } from '../types/hass.js';
import type { AutoSnoozeCardConfig, FilterTab } from '../types/card.js';
import type { AutomationItem, ParsedDuration, PauseGroup } from '../types/automation.js';
import { cardStyles } from '../styles/card.styles.js';
import {
  TIME_MS,
  MINUTES_PER,
  UI_TIMING,
  DEFAULT_DURATIONS,
  DEFAULT_SNOOZE_MINUTES,
  EXCLUDE_LABEL,
  INCLUDE_LABEL,
} from '../constants/index.js';
import {
  formatDateTime,
  formatCountdown,
  formatDuration,
  formatDurationShort,
  parseDurationInput,
  isDurationValid,
  durationToMinutes,
  minutesToDuration,
  getCurrentDateTime,
  combineDateTime,
  generateDateOptions,
  hapticFeedback,
  getErrorMessage,
} from '../utils/index.js';
import {
  fetchLabelRegistry,
  fetchCategoryRegistry,
  fetchEntityRegistry,
  pauseAutomations,
  wakeAutomation,
  wakeAll,
  cancelScheduled,
  saveLastDuration,
  loadLastDuration,
  type LastDurationData,
} from '../services/index.js';
import {
  formatRegistryId,
  getAreaName,
  getLabelName,
  getCategoryName,
  getAutomations,
  filterAutomations,
  groupAutomationsBy,
  getUniqueCount,
} from '../state/automations.js';
import {
  getPaused,
  getScheduled,
  getPausedGroupedByResumeTime,
} from '../state/paused.js';


@localized()
export class AutomationPauseCard extends LitElement {
  static styles = cardStyles;

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  config: AutoSnoozeCardConfig = {} as AutoSnoozeCardConfig;

  @state() private _selected: string[] = [];
  @state() private _duration: number = DEFAULT_SNOOZE_MINUTES * TIME_MS.MINUTE;
  @state() private _customDuration: ParsedDuration = { days: 0, hours: 0, minutes: DEFAULT_SNOOZE_MINUTES };
  @state() private _customDurationInput: string = '30m';
  @state() private _loading: boolean = false;
  @state() private _search: string = '';
  @state() private _filterTab: FilterTab = 'all';
  @state() private _expandedGroups: Record<string, boolean> = {};
  @state() private _scheduleMode: boolean = false;
  @state() private _disableAtDate: string = '';
  @state() private _disableAtTime: string = '';
  @state() private _resumeAtDate: string = '';
  @state() private _resumeAtTime: string = '';
  @state() private _labelRegistry: Record<string, HassLabel> = {};
  @state() private _categoryRegistry: Record<string, HassCategory> = {};
  @state() private _entityRegistry: Record<string, HassEntityRegistryEntry> = {};
  @state() private _showCustomInput: boolean = false;
  @state() private _automationsCache: AutomationItem[] | null = null;
  @state() private _automationsCacheVersion: number = 0;
  @state() private _wakeAllPending: boolean = false;
  @state() private _lastDuration: LastDurationData | null = null;

  private _interval: number | null = null;
  private _syncTimeout: number | null = null;
  private _labelsFetched: boolean = false;
  private _categoriesFetched: boolean = false;
  private _entityRegistryFetched: boolean = false;
  private _lastHassStates: HassEntities | null = null;
  private _lastCacheVersion: number = 0;
  private _searchTimeout: number | null = null;
  private _wakeAllTimeout: number | null = null;
  private _toastTimeout: number | null = null;
  private _toastFadeTimeout: number | null = null;

  static getConfigElement(): HTMLElement {
    return document.createElement('autosnooze-card-editor');
  }

  static getStubConfig(): AutoSnoozeCardConfig {
    return { type: 'custom:autosnooze-card', title: 'AutoSnooze' };
  }

  setConfig(config: AutoSnoozeCardConfig): void {
    this.config = config;
  }

  getCardSize(): number {
    const paused = this._getPaused();
    const scheduled = this._getScheduled();
    return 4 + Object.keys(paused).length + Object.keys(scheduled).length;
  }

  shouldUpdate(changedProps: PropertyValues): boolean {
    if (!changedProps.has('hass')) {
      return true;
    }

    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    const newHass = this.hass;

    if (!oldHass || !newHass) {
      return true;
    }

    const oldSensor = oldHass.states?.['sensor.autosnooze_snoozed_automations'];
    const newSensor = newHass.states?.['sensor.autosnooze_snoozed_automations'];
    if (oldSensor !== newSensor) {
      return true;
    }

    if (oldHass.entities !== newHass.entities) {
      return true;
    }

    if (oldHass.areas !== newHass.areas) {
      return true;
    }

    const newStates = newHass.states ?? {};
    const oldStates = oldHass.states ?? {};

    for (const entityId of Object.keys(newStates)) {
      if (entityId.startsWith('automation.')) {
        if (oldStates[entityId] !== newStates[entityId]) {
          return true;
        }
      }
    }

    for (const entityId of Object.keys(oldStates)) {
      if (entityId.startsWith('automation.') && !newStates[entityId]) {
        return true;
      }
    }

    // Check for language changes
    if (oldHass.language !== newHass.language) {
      return true;
    }

    return false;
  }

  updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('hass') && this.hass) {
      // Initialize locale from Home Assistant language setting
      initializeLocaleFromHA(this.hass);

      if (this.hass.connection) {
        if (!this._labelsFetched) {
          this._fetchLabelRegistry();
        }
        if (!this._categoriesFetched) {
          this._fetchCategoryRegistry();
        }
        if (!this._entityRegistryFetched) {
          this._fetchEntityRegistry();
        }
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this._interval) {
      window.clearInterval(this._interval);
      this._interval = null;
    }
    if (this._syncTimeout) {
      window.clearTimeout(this._syncTimeout);
      this._syncTimeout = null;
    }

    this._startSynchronizedCountdown();
    this._fetchLabelRegistry();
    this._fetchCategoryRegistry();
    this._fetchEntityRegistry();
    this._lastDuration = loadLastDuration();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._interval !== null) {
      clearInterval(this._interval);
      this._interval = null;
    }
    if (this._syncTimeout !== null) {
      clearTimeout(this._syncTimeout);
      this._syncTimeout = null;
    }
    if (this._searchTimeout !== null) {
      clearTimeout(this._searchTimeout);
      this._searchTimeout = null;
    }
    if (this._wakeAllTimeout !== null) {
      clearTimeout(this._wakeAllTimeout);
      this._wakeAllTimeout = null;
    }
    if (this._toastTimeout !== null) {
      clearTimeout(this._toastTimeout);
      this._toastTimeout = null;
    }
    if (this._toastFadeTimeout !== null) {
      clearTimeout(this._toastFadeTimeout);
      this._toastFadeTimeout = null;
    }
  }

  private _startSynchronizedCountdown(): void {
    const now = Date.now();
    const msUntilNextSecond = 1000 - (now % 1000);

    this._syncTimeout = window.setTimeout(() => {
      this._syncTimeout = null;
      this._updateCountdownIfNeeded();

      this._interval = window.setInterval(() => {
        this._updateCountdownIfNeeded();
      }, UI_TIMING.COUNTDOWN_INTERVAL_MS);
    }, msUntilNextSecond);
  }

  private _updateCountdownIfNeeded(): void {
    if (!this.hass) return;
    const paused = getPaused(this.hass);
    if (Object.keys(paused).length > 0) {
      this.requestUpdate();
    }
  }


  private async _fetchLabelRegistry(): Promise<void> {
    if (this._labelsFetched || !this.hass?.connection) return;
    this._labelRegistry = await fetchLabelRegistry(this.hass);
    this._labelsFetched = true;
  }

  private async _fetchCategoryRegistry(): Promise<void> {
    if (this._categoriesFetched || !this.hass?.connection) return;
    this._categoryRegistry = await fetchCategoryRegistry(this.hass);
    this._categoriesFetched = true;
  }

  private async _fetchEntityRegistry(): Promise<void> {
    if (this._entityRegistryFetched || !this.hass?.connection) return;
    this._entityRegistry = await fetchEntityRegistry(this.hass);
    this._entityRegistryFetched = true;
    this._automationsCacheVersion++;
  }

  private _getAutomations(): AutomationItem[] {
    if (!this.hass?.states) return [];

    const statesRef = this.hass.states;
    const currentVersion = this._automationsCacheVersion;

    if (
      this._lastHassStates === statesRef &&
      this._lastCacheVersion === currentVersion &&
      this._automationsCache
    ) {
      return this._automationsCache;
    }

    const result = getAutomations(this.hass, this._entityRegistry);
    this._automationsCache = result;
    this._lastCacheVersion = currentVersion;
    this._lastHassStates = statesRef;

    return result;
  }

  private _getFilteredAutomations(): AutomationItem[] {
    const automations = this._getAutomations();
    return filterAutomations(automations, this._search, this._labelRegistry);
  }

  private _getAreaName(areaId: string | null): string {
    if (!this.hass) return msg('Unassigned', { id: 'group.unassigned' });
    return getAreaName(areaId, this.hass);
  }

  private _getLabelName(labelId: string): string {
    return getLabelName(labelId, this._labelRegistry);
  }

  private _getCategoryName(categoryId: string | null): string {
    return getCategoryName(categoryId, this._categoryRegistry);
  }

  private _getGroupedByArea(): [string, AutomationItem[]][] {
    const automations = this._getFilteredAutomations();
    return groupAutomationsBy(
      automations,
      (auto) => auto.area_id ? [this._getAreaName(auto.area_id)] : null,
      msg('Unassigned', { id: 'group.unassigned' })
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
      msg('Unlabeled', { id: 'group.unlabeled' })
    );
  }

  private _getGroupedByCategory(): [string, AutomationItem[]][] {
    const automations = this._getFilteredAutomations();
    return groupAutomationsBy(
      automations,
      (auto) => auto.category_id ? [this._getCategoryName(auto.category_id)] : null,
      msg('Uncategorized', { id: 'group.uncategorized' })
    );
  }

  private _getAreaCount(): number {
    const automations = this._getAutomations();
    return getUniqueCount(automations, (auto) => auto.area_id ? [auto.area_id] : null);
  }

  private _getLabelCount(): number {
    const automations = this._getAutomations();
    const hiddenLabels = [EXCLUDE_LABEL.toLowerCase(), INCLUDE_LABEL.toLowerCase()];
    return getUniqueCount(automations, (auto) => {
      if (!auto.labels?.length) return null;
      const visibleLabels = auto.labels.filter(
        (id) => !hiddenLabels.includes(this._getLabelName(id).toLowerCase())
      );
      return visibleLabels.length > 0 ? visibleLabels : null;
    });
  }

  private _getCategoryCount(): number {
    const automations = this._getAutomations();
    return getUniqueCount(automations, (auto) => auto.category_id ? [auto.category_id] : null);
  }

  private _getPaused(): Record<string, unknown> {
    if (!this.hass) return {};
    return getPaused(this.hass);
  }

  private _getPausedGroupedByResumeTime(): PauseGroup[] {
    if (!this.hass) return [];
    return getPausedGroupedByResumeTime(this.hass);
  }

  private _getScheduled(): Record<string, ScheduledSnoozeAttribute> {
    if (!this.hass) return {};
    return getScheduled(this.hass);
  }

  private _formatDateTime(isoString: string): string {
    return formatDateTime(isoString, this._getLocale());
  }

  private _formatCountdown(resumeAt: string): string {
    return formatCountdown(resumeAt);
  }

  private _getLocale(): string | undefined {
    return this.hass?.locale?.language;
  }


  private _toggleSelection(id: string): void {
    hapticFeedback('selection');
    if (this._selected.includes(id)) {
      this._selected = this._selected.filter((s) => s !== id);
    } else {
      this._selected = [...this._selected, id];
    }
  }

  private _toggleGroupExpansion(group: string): void {
    this._expandedGroups = {
      ...this._expandedGroups,
      [group]: !this._expandedGroups[group],
    };
  }

  private _selectGroup(items: AutomationItem[]): void {
    const ids = items.map((i) => i.id);
    const allSelected = ids.every((id) => this._selected.includes(id));

    if (allSelected) {
      this._selected = this._selected.filter((id) => !ids.includes(id));
    } else {
      this._selected = [...new Set([...this._selected, ...ids])];
    }
  }

  private _selectAllVisible(): void {
    const filtered = this._getFilteredAutomations();
    const allIds = filtered.map((a) => a.id);
    const allSelected = allIds.every((id) => this._selected.includes(id));

    if (allSelected) {
      this._selected = this._selected.filter((id) => !allIds.includes(id));
    } else {
      this._selected = [...new Set([...this._selected, ...allIds])];
    }
  }

  private _clearSelection(): void {
    this._selected = [];
  }

  private _setDuration(minutes: number): void {
    this._duration = minutes * TIME_MS.MINUTE;
    const duration = minutesToDuration(minutes);
    this._customDuration = duration;
    this._customDurationInput = formatDurationShort(duration.days, duration.hours, duration.minutes) || '30m';
  }

  private _updateCustomDuration(): void {
    const totalMinutes = durationToMinutes(this._customDuration);
    this._duration = totalMinutes * TIME_MS.MINUTE;
  }

  private _handleDurationInput(value: string): void {
    this._customDurationInput = value;
    const parsed = parseDurationInput(value);
    if (parsed) {
      this._customDuration = parsed;
      this._updateCustomDuration();
    }
  }

  private _getDurationPreview(): string {
    const parsed = parseDurationInput(this._customDurationInput);
    if (!parsed) return '';
    return formatDuration(parsed.days, parsed.hours, parsed.minutes);
  }

  private _isDurationValid(): boolean {
    return isDurationValid(this._customDurationInput);
  }

  private _enterScheduleMode(): void {
    const { date, time } = getCurrentDateTime();
    this._scheduleMode = true;
    this._disableAtDate = date;
    this._disableAtTime = time;
    this._resumeAtDate = date;
    this._resumeAtTime = time;
  }

  private _hasResumeAt(): boolean {
    return Boolean(this._resumeAtDate && this._resumeAtTime);
  }

  private _hasDisableAt(): boolean {
    return Boolean(this._disableAtDate && this._disableAtTime);
  }

  // Pass-through methods for backward compatibility with tests
  // These delegate to utility functions to maintain modular design
  private _parseDurationInput(input: string): ParsedDuration | null {
    return parseDurationInput(input);
  }

  private _formatDuration(days: number, hours: number, minutes: number): string {
    return formatDuration(days, hours, minutes);
  }

  private _combineDateTime(date: string, time: string): string | null {
    return combineDateTime(date, time);
  }

  private _getErrorMessage(error: Error, defaultMessage: string): string {
    return getErrorMessage(error, defaultMessage);
  }

  private _formatRegistryId(id: string): string {
    return formatRegistryId(id);
  }

  private _handleKeyDown(e: KeyboardEvent, callback: () => void): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  }

  private _hapticFeedback(type: string = 'light'): void {
    hapticFeedback(type as 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'failure' | 'selection');
  }

  private _handleSearchInput(e: Event): void {
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

  private _showToast(message: string, options: { showUndo?: boolean; onUndo?: (() => void) | null } = {}): void {
    const { showUndo = false, onUndo = null } = options;

    if (!this.shadowRoot) return;

    const existingToast = this.shadowRoot.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');

    if (showUndo && onUndo) {
      const textSpan = document.createElement('span');
      textSpan.textContent = message;
      toast.appendChild(textSpan);

      const undoBtn = document.createElement('button');
      undoBtn.className = 'toast-undo-btn';
      undoBtn.textContent = msg('Undo', { id: 'button.undo' });
      undoBtn.setAttribute('aria-label', msg('Undo last action', { id: 'a11y.undo_action' }));
      undoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onUndo();
        toast.remove();
      });
      toast.appendChild(undoBtn);
    } else {
      toast.textContent = message;
    }

    this.shadowRoot.appendChild(toast);

    if (this._toastTimeout !== null) {
      clearTimeout(this._toastTimeout);
    }
    if (this._toastFadeTimeout !== null) {
      clearTimeout(this._toastFadeTimeout);
    }

    this._toastTimeout = window.setTimeout(() => {
      this._toastTimeout = null;
      if (!this.shadowRoot || !toast.parentNode) return;
      toast.style.animation = `slideUp ${UI_TIMING.TOAST_FADE_MS}ms ease-out reverse`;
      this._toastFadeTimeout = window.setTimeout(() => {
        this._toastFadeTimeout = null;
        if (toast.parentNode) toast.remove();
      }, UI_TIMING.TOAST_FADE_MS);
    }, UI_TIMING.TOAST_DURATION_MS);
  }

  private async _snooze(): Promise<void> {
    if (this._selected.length === 0 || this._loading) return;

    if (this._scheduleMode) {
      if (!this._hasResumeAt()) {
        this._showToast(msg('Please set a complete resume date and time', { id: 'toast.error.resume_time_required' }));
        return;
      }

      const disableAt = this._hasDisableAt()
        ? combineDateTime(this._disableAtDate, this._disableAtTime)
        : null;
      const resumeAt = combineDateTime(this._resumeAtDate, this._resumeAtTime);

      if (!resumeAt) {
        this._showToast(msg('Invalid resume date/time', { id: 'toast.error.invalid_datetime' }));
        return;
      }

      const nowWithBuffer = Date.now() + UI_TIMING.TIME_VALIDATION_BUFFER_MS;
      const resumeTime = new Date(resumeAt).getTime();

      if (resumeTime <= nowWithBuffer) {
        this._showToast(msg('Resume time must be in the future', { id: 'toast.error.resume_time_past' }));
        return;
      }

      if (disableAt) {
        const disableTime = new Date(disableAt).getTime();
        if (disableTime >= resumeTime) {
          this._showToast(msg('Snooze time must be before resume time', { id: 'toast.error.snooze_before_resume' }));
          return;
        }
      }
    } else {
      if (this._duration === 0) return;
    }

    this._loading = true;
    try {
      if (!this.hass) {
        this._loading = false;
        return;
      }

      const count = this._selected.length;
      const snoozedEntities = [...this._selected];
      const wasScheduleMode = this._scheduleMode;
      const hadDisableAt = this._hasDisableAt();
      let toastMessage: string;

      if (this._scheduleMode) {
        const disableAt = this._hasDisableAt()
          ? combineDateTime(this._disableAtDate, this._disableAtTime)
          : null;
        const resumeAt = combineDateTime(this._resumeAtDate, this._resumeAtTime);

        if (!resumeAt) {
          this._loading = false;
          return;
        }

        await pauseAutomations(this.hass, {
          entity_id: this._selected,
          resume_at: resumeAt,
          ...(disableAt && { disable_at: disableAt }),
        });

        if (!this.isConnected || !this.shadowRoot) {
          this._loading = false;
          return;
        }

        if (disableAt) {
          toastMessage = count === 1
            ? msg('Scheduled 1 automation to snooze', { id: 'toast.success.scheduled_one' })
            : msg(str`Scheduled ${count} automations to snooze`, { id: 'toast.success.scheduled_many' });
        } else {
          const formattedTime = this._formatDateTime(resumeAt);
          toastMessage = count === 1
            ? msg(str`Snoozed 1 automation until ${formattedTime}`, { id: 'toast.success.snoozed_until_one' })
            : msg(str`Snoozed ${count} automations until ${formattedTime}`, { id: 'toast.success.snoozed_until_many' });
        }
      } else {
        const { days, hours, minutes } = this._customDuration;

        await pauseAutomations(this.hass, {
          entity_id: this._selected,
          days,
          hours,
          minutes,
        });

        if (!this.isConnected || !this.shadowRoot) {
          this._loading = false;
          return;
        }

        const durationText = formatDuration(days, hours, minutes);
        toastMessage = count === 1
          ? msg(str`Snoozed 1 automation for ${durationText}`, { id: 'toast.success.snoozed_for_one' })
          : msg(str`Snoozed ${count} automations for ${durationText}`, { id: 'toast.success.snoozed_for_many' });

        // Save last used duration for quick re-use
        const totalMinutes = durationToMinutes(this._customDuration);
        saveLastDuration(this._customDuration, totalMinutes);
        this._lastDuration = { minutes: totalMinutes, duration: this._customDuration, timestamp: Date.now() };
      }

      this._hapticFeedback('success');

      this._showToast(toastMessage, {
        showUndo: true,
        onUndo: async () => {
          try {
            if (!this.hass) return;
            for (const entityId of snoozedEntities) {
              if (wasScheduleMode && hadDisableAt) {
                await cancelScheduled(this.hass, entityId);
              } else {
                await wakeAutomation(this.hass, entityId);
              }
            }
            if (this.isConnected) {
              this._selected = snoozedEntities;
              const restoredMsg = count === 1
                ? msg('Restored 1 automation', { id: 'toast.success.restored_one' })
                : msg(str`Restored ${count} automations`, { id: 'toast.success.restored_many' });
              this._showToast(restoredMsg);
            }
          } catch (e) {
            console.error('Undo failed:', e);
            if (this.isConnected && this.shadowRoot) {
              this._showToast(msg('Failed to undo. The automations may have already been modified.', { id: 'toast.error.undo_failed' }));
            }
          }
        },
      });

      this._selected = [];
      this._disableAtDate = '';
      this._disableAtTime = '';
      this._resumeAtDate = '';
      this._resumeAtTime = '';
    } catch (e) {
      console.error('Snooze failed:', e);
      this._hapticFeedback('failure');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(getErrorMessage(e as Error, 'Failed to snooze automations'));
      }
    }
    this._loading = false;
  }

  private async _wake(entityId: string): Promise<void> {
    if (!this.hass) return;
    try {
      await wakeAutomation(this.hass, entityId);
      this._hapticFeedback('success');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(msg('Automation resumed successfully', { id: 'toast.success.resumed' }));
      }
    } catch (e) {
      console.error('Wake failed:', e);
      this._hapticFeedback('failure');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(getErrorMessage(e as Error, msg('Failed to resume automation', { id: 'toast.error.resume_failed' })));
      }
    }
  }

  private async _handleWakeAll(): Promise<void> {
    if (this._wakeAllPending) {
      if (this._wakeAllTimeout !== null) {
        clearTimeout(this._wakeAllTimeout);
        this._wakeAllTimeout = null;
      }
      this._wakeAllPending = false;
      if (!this.hass) return;
      try {
        await wakeAll(this.hass);
        this._hapticFeedback('success');
        if (this.isConnected && this.shadowRoot) {
          this._showToast(msg('All automations resumed successfully', { id: 'toast.success.resumed_all' }));
        }
      } catch (e) {
        console.error('Wake all failed:', e);
        this._hapticFeedback('failure');
        if (this.isConnected && this.shadowRoot) {
          this._showToast(msg('Failed to resume automations. Check Home Assistant logs for details.', { id: 'toast.error.resume_all_failed' }));
        }
      }
    } else {
      this._hapticFeedback('medium');
      this._wakeAllPending = true;
      this._wakeAllTimeout = window.setTimeout(() => {
        this._wakeAllPending = false;
        this._wakeAllTimeout = null;
      }, UI_TIMING.WAKE_ALL_CONFIRM_MS);
    }
  }

  private async _cancelScheduled(entityId: string): Promise<void> {
    if (!this.hass) return;
    try {
      await cancelScheduled(this.hass, entityId);
      this._hapticFeedback('success');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(msg('Scheduled snooze cancelled successfully', { id: 'toast.success.cancelled' }));
      }
    } catch (e) {
      console.error('Cancel scheduled failed:', e);
      this._hapticFeedback('failure');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(getErrorMessage(e as Error, msg('Failed to cancel scheduled snooze', { id: 'toast.error.cancel_failed' })));
      }
    }
  }

  private _renderDateOptions(): TemplateResult[] {
    const options = generateDateOptions(365, this._getLocale());
    return options.map(
      (opt) => html`<option value="${opt.value}">${opt.label}</option>`
    );
  }

  private _getDurationPills(): { label: string; minutes: number | null; isLast?: boolean }[] {
    const pills: { label: string; minutes: number | null; isLast?: boolean }[] = [...DEFAULT_DURATIONS];

    // Insert "Last" pill at the start if we have a last duration that differs from presets
    if (this._lastDuration) {
      const lastMinutes = this._lastDuration.minutes;
      const isUniqueFromPresets = !DEFAULT_DURATIONS.some(
        (d) => d.minutes === lastMinutes
      );

      if (isUniqueFromPresets) {
        const { days, hours, minutes } = this._lastDuration.duration;
        const durationStr = formatDurationShort(days, hours, minutes).replace(/ /g, '');
        pills.unshift({ label: `Last ${durationStr}`, minutes: lastMinutes, isLast: true });
      }
    }

    return pills;
  }

  private _renderSelectionList(): TemplateResult | TemplateResult[] {
    const filtered = this._getFilteredAutomations();

    if (this._filterTab === 'all') {
      if (filtered.length === 0) {
        return html`<div class="list-empty" role="status">${msg('No automations found', { id: 'list.empty' })}</div>`;
      }
      return filtered.map((a) => html`
        <button
          type="button"
          class="list-item ${this._selected.includes(a.id) ? 'selected' : ''}"
          @click=${() => this._toggleSelection(a.id)}
          role="option"
          aria-selected=${this._selected.includes(a.id)}
        >
          <input
            type="checkbox"
            .checked=${this._selected.includes(a.id)}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${() => this._toggleSelection(a.id)}
            aria-label="Select ${a.name}"
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
      return html`<div class="list-empty" role="status">${msg('No automations found', { id: 'list.empty' })}</div>`;
    }

    return grouped.map(([groupName, items]) => {
      const expanded = this._expandedGroups[groupName] !== false;
      const groupSelected = items.every((i) => this._selected.includes(i.id));
      const someSelected = items.some((i) => this._selected.includes(i.id)) && !groupSelected;

      return html`
        <button
          type="button"
          class="group-header ${expanded ? 'expanded' : ''}"
          @click=${() => this._toggleGroupExpansion(groupName)}
          aria-expanded=${expanded}
          aria-label="${groupName} group, ${items.length} automations"
        >
          <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          <span>${groupName}</span>
          <span class="group-badge" aria-label="${items.length} automations">${items.length}</span>
          <input
            type="checkbox"
            .checked=${groupSelected}
            .indeterminate=${someSelected}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${() => this._selectGroup(items)}
            aria-label="Select all automations in ${groupName}"
            tabindex="-1"
          />
        </button>
        ${expanded
          ? items.map((a) => html`
                <button
                  type="button"
                  class="list-item ${this._selected.includes(a.id) ? 'selected' : ''}"
                  @click=${() => this._toggleSelection(a.id)}
                  role="option"
                  aria-selected=${this._selected.includes(a.id)}
                >
                  <input
                    type="checkbox"
                    .checked=${this._selected.includes(a.id)}
                    @click=${(e: Event) => e.stopPropagation()}
                    @change=${() => this._toggleSelection(a.id)}
                    aria-label="Select ${a.name}"
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

  private _renderDurationSelector(
    selectedDuration: { label: string; minutes: number | null } | undefined,
    durationPreview: string,
    durationValid: boolean
  ): TemplateResult {
    return this._scheduleMode
      ? html`
          <div class="schedule-inputs">
            <div class="datetime-field">
              <label id="snooze-at-label">${msg('Snooze at:', { id: 'schedule.snooze_at' })}</label>
              <div class="datetime-row">
                <select
                  .value=${this._disableAtDate}
                  @change=${(e: Event) => (this._disableAtDate = (e.target as HTMLSelectElement).value)}
                  aria-labelledby="snooze-at-label"
                  aria-label="${msg('Snooze date', { id: 'a11y.snooze_date' })}"
                >
                  <option value="">${msg('Select date', { id: 'schedule.select_date' })}</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._disableAtTime}
                  @input=${(e: Event) => (this._disableAtTime = (e.target as HTMLInputElement).value)}
                  aria-labelledby="snooze-at-label"
                  aria-label="${msg('Snooze time', { id: 'a11y.snooze_time' })}"
                />
              </div>
              <span class="field-hint">${msg('Leave empty to snooze immediately', { id: 'schedule.hint_immediate' })}</span>
            </div>
            <div class="datetime-field">
              <label id="resume-at-label">${msg('Resume at:', { id: 'schedule.resume_at' })}</label>
              <div class="datetime-row">
                <select
                  .value=${this._resumeAtDate}
                  @change=${(e: Event) => (this._resumeAtDate = (e.target as HTMLSelectElement).value)}
                  aria-labelledby="resume-at-label"
                  aria-label="${msg('Resume date', { id: 'a11y.resume_date' })}"
                >
                  <option value="">${msg('Select date', { id: 'schedule.select_date' })}</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._resumeAtTime}
                  @input=${(e: Event) => (this._resumeAtTime = (e.target as HTMLInputElement).value)}
                  aria-labelledby="resume-at-label"
                  aria-label="${msg('Resume time', { id: 'a11y.resume_time' })}"
                />
              </div>
            </div>
            <button
              type="button"
              class="schedule-link"
              @click=${() => (this._scheduleMode = false)}
            >
              <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
              ${msg('Back to duration selection', { id: 'schedule.back_to_duration' })}
            </button>
          </div>
        `
      : html`
          <div class="duration-selector">
            <div class="duration-section-header" id="duration-header">${msg('Snooze Duration', { id: 'duration.header' })}</div>
            <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
              ${this._getDurationPills().map(
                (d) => {
                  const currentMinutes = durationToMinutes(this._customDuration);
                  const isActive = d.minutes === null
                    ? this._showCustomInput
                    : !this._showCustomInput && d.minutes === currentMinutes;
                  return html`
                    <button
                      type="button"
                      class="pill ${isActive ? 'active' : ''}"
                      @click=${() => {
                        if (d.minutes === null) {
                          this._showCustomInput = !this._showCustomInput;
                        } else {
                          this._showCustomInput = false;
                          this._setDuration(d.minutes);
                        }
                      }}
                      role="radio"
                      aria-checked=${isActive}
                      aria-label="${d.minutes === null ? 'Custom duration' : d.isLast ? `Snooze for last used duration` : `Snooze for ${d.label}`}"
                    >
                      ${d.label}
                    </button>
                  `;
                }
              )}
            </div>

            ${this._showCustomInput ? html`
              <div class="custom-duration-input">
                <input
                  type="text"
                  class="duration-input ${!durationValid ? 'invalid' : ''}"
                  placeholder="${msg('e.g. 2h30m, 1.5h, 1d, 45m', { id: 'duration.placeholder' })}"
                  .value=${this._customDurationInput}
                  @input=${(e: Event) => this._handleDurationInput((e.target as HTMLInputElement).value)}
                  aria-label="${msg('Custom duration', { id: 'a11y.custom_duration' })}"
                  aria-invalid=${!durationValid}
                  aria-describedby="duration-help"
                />
                ${durationPreview && durationValid
                  ? html`<div class="duration-preview" role="status" aria-live="polite">${msg('Duration:', { id: 'duration.preview_label' })} ${durationPreview}</div>`
                  : html`<div class="duration-help" id="duration-help">${msg('Enter duration: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h', { id: 'duration.help' })}</div>`}
              </div>
            ` : ''}

            <button
              type="button"
              class="schedule-link"
              @click=${() => this._enterScheduleMode()}
            >
              <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
              ${msg('Pick specific date/time instead', { id: 'schedule.pick_datetime' })}
            </button>
          </div>
        `;
  }

  private _renderActivePauses(pausedCount: number): TemplateResult | string {
    if (pausedCount === 0) return '';

    return html`
      <div class="snooze-list" role="region" aria-label="${msg('Snoozed automations', { id: 'a11y.snoozed_region' })}">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          ${msg(str`Snoozed Automations (${pausedCount})`, { id: 'section.snoozed_count' })}
        </div>

        ${this._getPausedGroupedByResumeTime().map(
          (group) => html`
            <div class="pause-group" role="group" aria-label="${msg(str`Automations resuming ${this._formatDateTime(group.resumeAt)}`, { id: 'a11y.automations_resuming' })}">
              <div class="pause-group-header">
                <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                ${group.disableAt
                  ? html`${msg('Resumes', { id: 'status.resumes' })} ${this._formatDateTime(group.resumeAt)}`
                  : html`<span class="countdown" data-resume-at="${group.resumeAt}" aria-label="${msg(str`Time remaining: ${this._formatCountdown(group.resumeAt)}`, { id: 'a11y.time_remaining' })}">${this._formatCountdown(group.resumeAt)}</span>`}
              </div>
              ${group.automations.map(
                (auto) => html`
                  <div class="paused-item">
                    <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                    <div class="paused-info">
                      <div class="paused-name">${auto.friendly_name || auto.entity_id}</div>
                    </div>
                    <button type="button" class="wake-btn" @click=${() => this._wake(auto.entity_id)} aria-label="${msg(str`Resume ${auto.friendly_name || auto.entity_id}`, { id: 'a11y.resume_automation' })}">
                      ${msg('Resume', { id: 'button.resume' })}
                    </button>
                  </div>
                `
              )}
            </div>
          `
        )}

        ${pausedCount > 1
          ? html`
              <button
                type="button"
                class="wake-all ${this._wakeAllPending ? 'pending' : ''}"
                @click=${() => this._handleWakeAll()}
                aria-label="${this._wakeAllPending ? msg('Confirm resume all automations', { id: 'a11y.confirm_resume_all' }) : msg('Resume all paused automations', { id: 'a11y.resume_all' })}"
              >
                ${this._wakeAllPending ? msg('Confirm Resume All', { id: 'button.confirm_resume_all' }) : msg('Resume All', { id: 'button.resume_all' })}
              </button>
            `
          : ''}
      </div>
    `;
  }

  private _renderScheduledPauses(scheduledCount: number, scheduled: Record<string, { friendly_name?: string; disable_at?: string; resume_at: string }>): TemplateResult | string {
    if (scheduledCount === 0) return '';

    return html`
      <div class="scheduled-list" role="region" aria-label="${msg('Scheduled snoozes', { id: 'a11y.scheduled_region' })}">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          ${msg(str`Scheduled Snoozes (${scheduledCount})`, { id: 'section.scheduled_count' })}
        </div>

        ${Object.entries(scheduled).map(
          ([id, data]) => html`
            <div class="scheduled-item" role="article" aria-label="${msg(str`Scheduled pause for ${data.friendly_name || id}`, { id: 'a11y.scheduled_pause_for' })}">
              <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
              <div class="paused-info">
                <div class="paused-name">
                  ${data.friendly_name || id}
                </div>
                <div class="scheduled-time">
                  ${msg('Disables:', { id: 'status.disables' })} ${this._formatDateTime(data.disable_at || 'now')}
                </div>
                <div class="paused-time">
                  ${msg('Resumes:', { id: 'status.resumes_at' })} ${this._formatDateTime(data.resume_at)}
                </div>
              </div>
              <button type="button" class="cancel-scheduled-btn" @click=${() => this._cancelScheduled(id)} aria-label="${msg(str`Cancel scheduled pause for ${data.friendly_name || id}`, { id: 'a11y.cancel_scheduled_for' })}">
                ${msg('Cancel', { id: 'button.cancel' })}
              </button>
            </div>
          `
        )}
      </div>
    `;
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) {
      return html``;
    }

    const paused = this._getPaused();
    const pausedCount = Object.keys(paused).length;
    const scheduled = this._getScheduled();
    const scheduledCount = Object.keys(scheduled).length;

    const currentDuration =
      this._customDuration.days * MINUTES_PER.DAY +
      this._customDuration.hours * MINUTES_PER.HOUR +
      this._customDuration.minutes;

    const selectedDuration = DEFAULT_DURATIONS.find((d) => d.minutes === currentDuration);
    const durationPreview = this._getDurationPreview();
    const durationValid = this._isDurationValid();

    return html`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title || msg('AutoSnooze', { id: 'card.default_title' })}
          ${pausedCount > 0 || scheduledCount > 0
            ? html`<span class="status-summary"
                >${pausedCount > 0 ? msg(str`${pausedCount} active`, { id: 'status.active_count' }) : ''}${pausedCount > 0 && scheduledCount > 0 ? ', ' : ''}${scheduledCount > 0 ? msg(str`${scheduledCount} scheduled`, { id: 'status.scheduled_count' }) : ''}</span
              >`
            : ''}
        </div>

        <div class="snooze-setup">
          <div class="filter-tabs" role="tablist" aria-label="${msg('Filter automations by', { id: 'a11y.filter_tabs' })}">
            <button
              type="button"
              class="tab ${this._filterTab === 'all' ? 'active' : ''}"
              @click=${() => (this._filterTab = 'all')}
              role="tab"
              aria-selected=${this._filterTab === 'all'}
              aria-controls="selection-list"
            >
              ${msg('All', { id: 'tab.all' })}
              <span class="tab-count" aria-label="${msg(str`${this._getAutomations().length} automations`, { id: 'a11y.automation_count' })}">${this._getAutomations().length}</span>
            </button>
            <button
              type="button"
              class="tab ${this._filterTab === 'areas' ? 'active' : ''}"
              @click=${() => (this._filterTab = 'areas')}
              role="tab"
              aria-selected=${this._filterTab === 'areas'}
              aria-controls="selection-list"
            >
              ${msg('Areas', { id: 'tab.areas' })}
              <span class="tab-count" aria-label="${msg(str`${this._getAreaCount()} areas`, { id: 'a11y.area_count' })}">${this._getAreaCount()}</span>
            </button>
            <button
              type="button"
              class="tab ${this._filterTab === 'categories' ? 'active' : ''}"
              @click=${() => (this._filterTab = 'categories')}
              role="tab"
              aria-selected=${this._filterTab === 'categories'}
              aria-controls="selection-list"
            >
              ${msg('Categories', { id: 'tab.categories' })}
              <span class="tab-count" aria-label="${msg(str`${this._getCategoryCount()} categories`, { id: 'a11y.category_count' })}">${this._getCategoryCount()}</span>
            </button>
            <button
              type="button"
              class="tab ${this._filterTab === 'labels' ? 'active' : ''}"
              @click=${() => (this._filterTab = 'labels')}
              role="tab"
              aria-selected=${this._filterTab === 'labels'}
              aria-controls="selection-list"
            >
              ${msg('Labels', { id: 'tab.labels' })}
              <span class="tab-count" aria-label="${msg(str`${this._getLabelCount()} labels`, { id: 'a11y.label_count' })}">${this._getLabelCount()}</span>
            </button>
          </div>

          <div class="search-box">
            <input
              type="search"
              placeholder="${msg('Search automations...', { id: 'search.placeholder' })}"
              .value=${this._search}
              @input=${(e: Event) => this._handleSearchInput(e)}
              aria-label="${msg('Search automations by name', { id: 'a11y.search' })}"
            />
          </div>

          ${this._getFilteredAutomations().length > 0
            ? html`
                <div class="selection-actions" role="toolbar" aria-label="${msg('Selection actions', { id: 'a11y.selection_actions' })}">
                  <span role="status" aria-live="polite">${msg(str`${this._selected.length} of ${this._getFilteredAutomations().length} selected`, { id: 'selection.count' })}</span>
                  <button
                    type="button"
                    class="select-all-btn"
                    @click=${() => this._selectAllVisible()}
                    aria-label="${this._getFilteredAutomations().every((a) => this._selected.includes(a.id))
                      ? msg('Deselect all visible automations', { id: 'a11y.deselect_all' })
                      : msg('Select all visible automations', { id: 'a11y.select_all' })}"
                  >
                    ${this._getFilteredAutomations().every((a) => this._selected.includes(a.id))
                      ? msg('Deselect All', { id: 'button.deselect_all' })
                      : msg('Select All', { id: 'button.select_all' })}
                  </button>
                  ${this._selected.length > 0
                    ? html`<button type="button" class="select-all-btn" @click=${() => this._clearSelection()} aria-label="${msg('Clear selection', { id: 'a11y.clear_selection' })}">${msg('Clear', { id: 'button.clear' })}</button>`
                    : ''}
                </div>
              `
            : ''}

          <div class="selection-list" id="selection-list" role="listbox" aria-label="${msg('Automations list', { id: 'a11y.automations_list' })}" aria-multiselectable="true">
            ${this._renderSelectionList()}
          </div>

          ${this._renderDurationSelector(selectedDuration, durationPreview, durationValid)}

          <button
            type="button"
            class="snooze-btn"
            ?disabled=${this._selected.length === 0 ||
            (!this._scheduleMode && !this._isDurationValid()) ||
            (this._scheduleMode && !this._hasResumeAt()) ||
            this._loading}
            @click=${() => this._snooze()}
            aria-label="${this._loading
              ? msg('Snoozing automations', { id: 'a11y.snoozing' })
              : this._scheduleMode
                ? msg(str`Schedule snooze for ${this._selected.length} automations`, { id: 'a11y.schedule_snooze' })
                : msg(str`Snooze ${this._selected.length} automations`, { id: 'a11y.snooze_count' })}"
            aria-busy=${this._loading}
          >
            ${this._loading
              ? msg('Snoozing...', { id: 'button.snoozing' })
              : this._scheduleMode
                ? msg(str`Schedule (${this._selected.length})`, { id: 'button.schedule_count' })
                : msg(str`Snooze (${this._selected.length})`, { id: 'button.snooze_count' })}
          </button>
        </div>

        ${this._renderActivePauses(pausedCount)}
        ${this._renderScheduledPauses(scheduledCount, scheduled)}
      </ha-card>
    `;
  }
}
