/**
 * AutoSnooze Main Card Component.
 * A Lovelace card for temporarily pausing Home Assistant automations.
 */

import { LitElement, html, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant, HassLabel, HassCategory, HassEntityRegistryEntry, HassEntities, PausedAutomationAttribute, ScheduledSnoozeAttribute } from '../types/hass.js';
import type { AutoSnoozeCardConfig } from '../types/card.js';
import type { AutomationItem, ParsedDuration, PauseGroup } from '../types/automation.js';
import { cardStyles } from '../styles/card.styles.js';
import { sharedPausedStyles } from '../styles/shared.styles.js';
import {
  TIME_MS,
  UI_TIMING,
  DEFAULT_SNOOZE_MINUTES,
} from '../constants/index.js';
import {
  fetchLabelRegistry,
  fetchCategoryRegistry,
  fetchEntityRegistry,
} from '../services/registry.js';
import {
  loadLastDuration,
  loadRecentSnoozes,
  type LastDurationData,
} from '../services/storage.js';
import { formatDateTime } from '../utils/time-formatting.js';
import { isDurationValid } from '../utils/duration-parsing.js';
import { hapticFeedback } from '../utils/haptic.js';
import { getErrorMessage } from '../utils/errors.js';
import { runPauseFeature } from '../features/pause/index.js';
import {
  runUndoFeature,
  runWakeAllFeature,
  runWakeFeature,
} from '../features/resume/index.js';
import {
  runAdjustFeature,
  runCancelScheduledFeature,
  validateScheduledPauseInput,
} from '../features/scheduled-snooze/index.js';
import {
  createAdjustModalState,
  createClosedAdjustModalState,
  createScheduleModeState,
} from '../features/card-shell/index.js';
import {
  getScheduledValidationToastKey,
  haveAutomationStatesChanged,
  renderScheduledPausesSection,
  resolveAdjustModalSync,
  showCardToast,
  type CardToastTimers,
} from '../utils/card-shell-ui.js';
import {
  getAutomations,
} from '../features/automation-list/index.js';
import {
  getPausedSnapshot,
  SENSOR_ENTITY_ID,
} from '../state/paused.js';
import { createCardStore } from '../state/card-store.js';
import type { HapticFeedbackType } from '../types/card.js';


export class AutomationPauseCard extends LitElement {
  static styles = [sharedPausedStyles, cardStyles];

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  config: AutoSnoozeCardConfig = {} as AutoSnoozeCardConfig;

  private _cardStore = createCardStore();

  @state() private _selected: string[] = [];
  @state() private _duration: number = DEFAULT_SNOOZE_MINUTES * TIME_MS.MINUTE;
  @state() private _customDuration: ParsedDuration = { days: 0, hours: 0, minutes: DEFAULT_SNOOZE_MINUTES };
  @state() private _customDurationInput: string = '30m';
  @state() private _loading: boolean = false;
  @state() private _scheduleMode: boolean = false;
  @state() private _disableAtDate: string = '';
  @state() private _disableAtTime: string = '';
  @state() private _resumeAtDate: string = '';
  @state() private _resumeAtTime: string = '';
  @state() private _labelRegistry: Record<string, HassLabel> = {};
  @state() private _labelRegistryUnavailable: boolean = false;
  @state() private _categoryRegistry: Record<string, HassCategory> = {};
  @state() private _entityRegistry: Record<string, HassEntityRegistryEntry> = {};
  @state() private _showCustomInput: boolean = false;
  @state() private _automationsCache: AutomationItem[] | null = null;
  @state() private _automationsCacheVersion: number = 0;
  @state() private _lastDuration: LastDurationData | null = null;
  @state() _recentSnoozeIds: string[] = [];
  @state() private _adjustModalOpen: boolean = false;
  @state() private _adjustModalEntityId: string = '';
  @state() private _adjustModalFriendlyName: string = '';
  @state() private _adjustModalResumeAt: string = '';
  @state() private _adjustModalEntityIds: string[] = [];
  @state() private _adjustModalFriendlyNames: string[] = [];
  @state() private _guardrailConfirmOpen: boolean = false;

  private _labelsFetched: boolean = false;
  private _categoriesFetched: boolean = false;
  private _entityRegistryFetched: boolean = false;
  private _labelRegistryFetchPromise: Promise<void> | null = null;
  private _categoryRegistryFetchPromise: Promise<void> | null = null;
  private _entityRegistryFetchPromise: Promise<void> | null = null;
  private _lastHassStates: HassEntities | null = null;
  private _lastCacheVersion: number = 0;
  private _toastTimers: CardToastTimers = {
    toastTimeout: null,
    toastFadeTimeout: null,
  };
  private _labelRegistryRetryTimeout: number | null = null;
  private _labelRegistryRetryDelayMs: number = UI_TIMING.REGISTRY_RETRY_MIN_MS;
  private _hapticFeedback = (type: HapticFeedbackType = 'light'): void => {
    hapticFeedback(type);
  };
  _showToast = (message: string, options: { showUndo?: boolean; onUndo?: (() => void) | null } = {}): void => {
    showCardToast(this.shadowRoot, this._toastTimers, this.hass, message, options);
  };
  _getLocale = (): string | undefined => this.hass?.locale?.language;
  _formatDateTime = (isoString: string): string => formatDateTime(isoString, this._getLocale());
  _handleWakeEvent = async (e: CustomEvent<{ entityId: string }>): Promise<void> => {
    await this._wake(e.detail.entityId);
  };
  _handleAdjustAutomationEvent = (
    e: CustomEvent<{ entityId: string; friendlyName: string; resumeAt: string }>
  ): void => {
    this._handleAdjustModalOpenEvent(e);
  };
  _handleAdjustGroupEvent = (
    e: CustomEvent<{ entityIds: string[]; friendlyNames: string[]; resumeAt: string }>
  ): void => {
    this._handleAdjustModalOpenEvent(e);
  };
  _getAutomationStateFingerprint = (states: HassEntities): string =>
    Object.entries(states)
      .filter(([entityId]) => entityId.startsWith('automation.'))
      .map(([entityId, state]) => `${entityId}:${state.state}`)
      .sort()
      .join('|');

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
    const snapshot = this._getPausedSnapshot();
    const paused = snapshot.paused;
    const scheduled = snapshot.scheduled;
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

    const oldSensor = oldHass.states?.[SENSOR_ENTITY_ID];
    const newSensor = newHass.states?.[SENSOR_ENTITY_ID];
    if (oldSensor !== newSensor) {
      return true;
    }

    if (oldHass.entities !== newHass.entities) {
      return true;
    }

    if (oldHass.areas !== newHass.areas) {
      return true;
    }

    // Check for language changes
    const oldLanguage = oldHass.language ?? oldHass.locale?.language;
    const newLanguage = newHass.language ?? newHass.locale?.language;
    if (oldLanguage !== newLanguage) {
      return true;
    }

    const newStates = newHass.states;
    const oldStates = oldHass.states;
    if (!newStates || !oldStates) {
      return true;
    }

    // Fast path: no state object churn means no automation change scan needed.
    if (oldStates === newStates) {
      return false;
    }

    return haveAutomationStatesChanged(oldStates, newStates);
  }

  updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('hass') && this.hass?.connection) {
      if (!this._labelsFetched && this._labelRegistryRetryTimeout === null) {
        this._fetchLabelRegistry();
      }
      if (!this._categoriesFetched) {
        this._fetchCategoryRegistry();
      }
      if (!this._entityRegistryFetched) {
        this._fetchEntityRegistry();
      }
    }
    if (changedProps.has('hass') && this._adjustModalOpen) {
      const sync = resolveAdjustModalSync({
        paused: this._getPausedSnapshot().paused,
        entityIds: this._adjustModalEntityIds,
        entityId: this._adjustModalEntityId,
        currentResumeAt: this._adjustModalResumeAt,
      });
      if (sync.nextResumeAt) {
        this._adjustModalResumeAt = sync.nextResumeAt;
      }
      if (sync.shouldClose) {
        this._handleCloseModalEvent();
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();

    this._fetchLabelRegistry();
    this._fetchCategoryRegistry();
    this._fetchEntityRegistry();
    this._lastDuration = loadLastDuration();
    this._recentSnoozeIds = loadRecentSnoozes();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._toastTimers.toastTimeout !== null) {
      clearTimeout(this._toastTimers.toastTimeout);
      this._toastTimers.toastTimeout = null;
    }
    if (this._toastTimers.toastFadeTimeout !== null) {
      clearTimeout(this._toastTimers.toastFadeTimeout);
      this._toastTimers.toastFadeTimeout = null;
    }
    if (this._labelRegistryRetryTimeout !== null) {
      clearTimeout(this._labelRegistryRetryTimeout);
      this._labelRegistryRetryTimeout = null;
    }
  }

  private async _fetchLabelRegistry(): Promise<void> {
    await this._runRegistryFetch(
      '_labelsFetched',
      '_labelRegistryFetchPromise',
      () => fetchLabelRegistry(this.hass!),
      (labels) => {
        if (labels === null) {
          this._labelsFetched = false;
          this._labelRegistryUnavailable = true;
          if (this._labelRegistryRetryTimeout === null) {
            const delay = this._labelRegistryRetryDelayMs;
            this._labelRegistryRetryTimeout = window.setTimeout(() => {
              this._labelRegistryRetryTimeout = null;
              if (!this.isConnected) return;
              void this._fetchLabelRegistry();
            }, delay);
            this._labelRegistryRetryDelayMs = Math.min(
              this._labelRegistryRetryDelayMs * 2,
              UI_TIMING.REGISTRY_RETRY_MAX_MS,
            );
          }
          return;
        }

        this._labelRegistry = labels;
        this._labelsFetched = true;
        this._labelRegistryUnavailable = false;
        this._automationsCacheVersion++;
        this._labelRegistryRetryDelayMs = UI_TIMING.REGISTRY_RETRY_MIN_MS;
        if (this._labelRegistryRetryTimeout !== null) {
          clearTimeout(this._labelRegistryRetryTimeout);
          this._labelRegistryRetryTimeout = null;
        }
      }
    );
  }

  private async _fetchCategoryRegistry(): Promise<void> {
    await this._runRegistryFetch(
      '_categoriesFetched',
      '_categoryRegistryFetchPromise',
      () => fetchCategoryRegistry(this.hass!),
      (categories) => {
        this._categoryRegistry = categories;
        this._categoriesFetched = true;
      }
    );
  }

  private async _fetchEntityRegistry(): Promise<void> {
    await this._runRegistryFetch(
      '_entityRegistryFetched',
      '_entityRegistryFetchPromise',
      () => fetchEntityRegistry(this.hass!),
      (entities) => {
        this._entityRegistry = entities;
        this._entityRegistryFetched = true;
        this._automationsCacheVersion++;
      }
    );
  }

  private async _runRegistryFetch<Result>(
    stateKey: '_labelsFetched' | '_categoriesFetched' | '_entityRegistryFetched',
    promiseKey: '_labelRegistryFetchPromise' | '_categoryRegistryFetchPromise' | '_entityRegistryFetchPromise',
    run: () => Promise<Result>,
    onResult: (result: Result) => void,
  ): Promise<void> {
    if (this[stateKey] || !this.hass?.connection) return;
    const inFlight = this[promiseKey];
    if (inFlight) {
      await inFlight;
      return;
    }

    this[promiseKey] = (async () => {
      const result = await run();
      onResult(result);
    })();

    try {
      await this[promiseKey];
    } finally {
      this[promiseKey] = null;
    }
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

  private _getPaused(): Record<string, PausedAutomationAttribute> {
    return this._getPausedSnapshot().paused;
  }

  private _getPausedGroupedByResumeTime(): PauseGroup[] {
    return this._getPausedSnapshot().groups;
  }

  private _getScheduled(): Record<string, ScheduledSnoozeAttribute> {
    return this._getPausedSnapshot().scheduled;
  }

  private _getPausedSnapshot(): {
    paused: Record<string, PausedAutomationAttribute>;
    scheduled: Record<string, ScheduledSnoozeAttribute>;
    groups: PauseGroup[];
  } {
    if (!this.hass) {
      return {
        paused: {},
        scheduled: {},
        groups: [],
      };
    }
    return getPausedSnapshot(this.hass);
  }

  private _hasResumeAt(): boolean {
    return Boolean(this._resumeAtDate && this._resumeAtTime);
  }

  private _hasDisableAt(): boolean {
    return Boolean(this._disableAtDate && this._disableAtTime);
  }

  private async _snooze(forceConfirm: boolean = false): Promise<void> {
    if (this._selected.length === 0 || this._loading) return;

    if (this._scheduleMode) {
      if (!this._hasResumeAt()) {
        this._showToast( localize(this.hass, 'toast.error.resume_time_required'));
        return;
      }

      const scheduleValidation = validateScheduledPauseInput({
        disableAtDate: this._disableAtDate,
        disableAtTime: this._disableAtTime,
        resumeAtDate: this._resumeAtDate,
        resumeAtTime: this._resumeAtTime,
        nowMs: Date.now() + UI_TIMING.TIME_VALIDATION_BUFFER_MS,
      });

      if (scheduleValidation.status === 'error') {
        this._showToast( localize(this.hass, getScheduledValidationToastKey(scheduleValidation.message)));
        return;
      }
    } else {
      if (this._duration === 0) return;
    }

    this._loading = true;
    this._guardrailConfirmOpen = false;
    try {
      if (!this.hass) {
        this._loading = false;
        return;
      }

      const count = this._selected.length;
      const snoozedEntities = [...this._selected];
      const wasScheduleMode = this._scheduleMode;
      const hadDisableAt = this._hasDisableAt();
      const pauseResult = await runPauseFeature({
        hass: this.hass,
        selected: this._selected,
        scheduleMode: this._scheduleMode,
        customDuration: this._customDuration,
        disableAtDate: this._disableAtDate,
        disableAtTime: this._disableAtTime,
        resumeAtDate: this._resumeAtDate,
        resumeAtTime: this._resumeAtTime,
        forceConfirm,
      });

      if (pauseResult.status === 'confirm_required') {
        this._guardrailConfirmOpen = true;
        this._loading = false;
        return;
      }

      if (pauseResult.status === 'aborted') {
        this._loading = false;
        return;
      }

      if (pauseResult.lastDuration) {
        this._lastDuration = pauseResult.lastDuration;
      }

      this._recentSnoozeIds = loadRecentSnoozes();

      if (!this.isConnected || !this.shadowRoot) {
        this._loading = false;
        return;
      }

      this._hapticFeedback('success');

      this._showToast( pauseResult.toastMessage, {
        showUndo: true,
        onUndo: async () => {
          try {
            if (!this.hass) return;
            const undoResult = await runUndoFeature(this.hass, snoozedEntities, {
              wasScheduleMode,
              hadDisableAt,
            });
            if (this.isConnected) {
              if (undoResult.failed.length === 0) {
                this._setSelected(snoozedEntities);
                const restoredMsg = count === 1
                  ? localize(this.hass, 'toast.success.restored_one')
                  : localize(this.hass, 'toast.success.restored_many', { count });
                this._showToast( restoredMsg);
              } else {
                // Keep only failed entities selected to make retry easier.
                this._setSelected(undoResult.failed);
                this._showToast( localize(this.hass, 'toast.error.undo_failed'));
              }
            }
          } catch (e) {
            console.error('Undo failed:', e);
            if (this.isConnected && this.shadowRoot) {
              this._showToast( localize(this.hass, 'toast.error.undo_failed'));
            }
          }
        },
      });

      this._setSelected([]);
      this._disableAtDate = '';
      this._disableAtTime = '';
      this._resumeAtDate = '';
      this._resumeAtTime = '';
    } catch (e) {
      console.error('Snooze failed:', e);
      this._hapticFeedback('failure');
      if (this.isConnected && this.shadowRoot) {
        this._showToast( getErrorMessage(e as Error, 'Failed to snooze automations'));
      }
    }
    this._loading = false;
  }

  private async _wake(entityId: string): Promise<void> {
    if (!this.hass) return;
    await this._runCardAction({
      run: () => runWakeFeature(this.hass!, entityId),
      successMessage: localize(this.hass, 'toast.success.resumed'),
      failureLog: 'Wake failed:',
      failureMessage: localize(this.hass, 'toast.error.resume_failed'),
    });
  }

  private async _handleWakeAllEvent(): Promise<void> {
    if (!this.hass) return;
    await this._runCardAction({
      run: () => runWakeAllFeature(this.hass!),
      successMessage: localize(this.hass, 'toast.success.resumed_all'),
      failureLog: 'Wake all failed:',
      failureMessage: localize(this.hass, 'toast.error.resume_all_failed'),
    });
  }


  private _handleAdjustModalOpenEvent(
    e: CustomEvent<{
      entityId?: string;
      friendlyName?: string;
      entityIds?: string[];
      friendlyNames?: string[];
      resumeAt: string;
    }>
  ): void {
    this._applyAdjustModalState(createAdjustModalState(e.detail));
  }

  private async _handleAdjustTimeEvent(
    e: CustomEvent<{ entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number }>
  ): Promise<void> {
    if (!this.hass) return;
    await this._runCardAction({
      run: () => runAdjustFeature(this.hass!, e.detail, this._adjustModalResumeAt),
      onSuccess: (adjustResult) => {
        this._adjustModalResumeAt = adjustResult.nextResumeAt;
      },
      successMessage: localize(this.hass, 'toast.success.adjusted'),
      failureLog: 'Adjust failed:',
      failureMessage: localize(this.hass, 'toast.error.adjust_failed'),
    });
  }

  private _handleCloseModalEvent(): void {
    this._applyAdjustModalState(createClosedAdjustModalState());
  }

  private async _cancelScheduled(entityId: string): Promise<void> {
    if (!this.hass) return;
    await this._runCardAction({
      run: () => runCancelScheduledFeature(this.hass!, entityId),
      successMessage: localize(this.hass, 'toast.success.cancelled'),
      failureLog: 'Cancel scheduled failed:',
      failureMessage: localize(this.hass, 'toast.error.cancel_failed'),
    });
  }

  private _applyAdjustModalState(state: ReturnType<typeof createAdjustModalState> | ReturnType<typeof createClosedAdjustModalState>): void {
    this._adjustModalOpen = state.adjustModalOpen;
    this._adjustModalEntityId = state.adjustModalEntityId;
    this._adjustModalFriendlyName = state.adjustModalFriendlyName;
    this._adjustModalResumeAt = state.adjustModalResumeAt;
    this._adjustModalEntityIds = state.adjustModalEntityIds;
    this._adjustModalFriendlyNames = state.adjustModalFriendlyNames;
  }

  private async _runCardAction<T>({
    run,
    onSuccess,
    successMessage,
    failureLog,
    failureMessage,
  }: {
    run: () => Promise<T>;
    onSuccess?: (result: T) => void;
    successMessage: string;
    failureLog: string;
    failureMessage: string;
  }): Promise<void> {
    try {
      const result = await run();
      onSuccess?.(result);
      this._hapticFeedback('success');
      if (this.isConnected && this.shadowRoot) {
        this._showToast( successMessage);
      }
    } catch (e) {
      console.error(failureLog, e);
      this._hapticFeedback('failure');
      if (this.isConnected && this.shadowRoot) {
        this._showToast( getErrorMessage(e as Error, failureMessage));
      }
    }
  }

  private _setSelected(selected: string[]): void {
    this._cardStore.setSelection(selected);
    this._selected = this._cardStore.getState().selected;
  }

  private _setDurationState(duration: ParsedDuration, input: string): void {
    this._cardStore.setDuration(duration, input);
    const state = this._cardStore.getState();
    this._duration = state.durationMs;
    this._customDuration = state.customDuration;
    this._customDurationInput = state.customDurationInput;
  }

  private _handleDurationChange(e: CustomEvent<{ minutes: number; duration: ParsedDuration; input: string; showCustomInput?: boolean }>): void {
    const { duration, input, showCustomInput } = e.detail;
    this._setDurationState(duration, input);
    if (showCustomInput !== undefined) {
      this._showCustomInput = showCustomInput;
    }
  }

  private _handleScheduleModeChange(e: CustomEvent<{ enabled: boolean }>): void {
    const scheduleState = createScheduleModeState({
      enabled: e.detail.enabled,
      now: new Date(),
      resumeMinutes: this._lastDuration?.minutes ?? DEFAULT_SNOOZE_MINUTES,
    });
    this._scheduleMode = scheduleState.scheduleMode;
    if (!e.detail.enabled) {
      return;
    }
    this._disableAtDate = scheduleState.disableAtDate;
    this._disableAtTime = scheduleState.disableAtTime;
    this._resumeAtDate = scheduleState.resumeAtDate;
    this._resumeAtTime = scheduleState.resumeAtTime;
  }

  private _handleScheduleFieldChange(e: CustomEvent<{ field: string; value: string }>): void {
    const { field, value } = e.detail;
    const updateField = {
      disableAtDate: () => { this._disableAtDate = value; },
      disableAtTime: () => { this._disableAtTime = value; },
      resumeAtDate: () => { this._resumeAtDate = value; },
      resumeAtTime: () => { this._resumeAtTime = value; },
    }[field];

    updateField?.();
  }

  private _handleCustomInputToggle(e: CustomEvent<{ show: boolean }>): void {
    this._showCustomInput = e.detail.show;
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) {
      return html``;
    }

    const pausedSnapshot = this._getPausedSnapshot();
    const paused = pausedSnapshot.paused;
    const pausedCount = Object.keys(paused).length;
    const scheduled = pausedSnapshot.scheduled;
    const scheduledCount = Object.keys(scheduled).length;
    const automations = this._getAutomations();
    const sensorAvailable = Boolean(this.hass?.states?.[SENSOR_ENTITY_ID]);

    return html`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title || localize(this.hass, 'card.default_title')}
          ${pausedCount > 0 || scheduledCount > 0
            ? html`<span class="status-summary"
                >${pausedCount > 0 ? localize(this.hass, 'status.active_count', { count: pausedCount }) : ''}${pausedCount > 0 && scheduledCount > 0 ? ', ' : ''}${scheduledCount > 0 ? localize(this.hass, 'status.scheduled_count', { count: scheduledCount }) : ''}</span
              >`
            : ''}
        </div>

        ${!sensorAvailable
          ? html`
              <div class="sensor-health-banner" role="status">
                ${localize(this.hass, 'status.sensor_unavailable')}
              </div>
            `
          : ''}

        <div class="snooze-setup">
          <autosnooze-automation-list
            .hass=${this.hass}
            .automations=${automations}
            .selected=${this._selected}
            .labelRegistry=${this._labelRegistry}
            .labelRegistryUnavailable=${this._labelRegistryUnavailable}
            .categoryRegistry=${this._categoryRegistry}
            .recentSnoozeIds=${this._recentSnoozeIds}
            @selection-change=${(e: CustomEvent<{ selected: string[] }>) => this._setSelected(e.detail.selected)}
          ></autosnooze-automation-list>

          <autosnooze-duration-selector
            .hass=${this.hass}
            .scheduleMode=${this._scheduleMode}
            .customDuration=${this._customDuration}
            .customDurationInput=${this._customDurationInput}
            .showCustomInput=${this._showCustomInput}
            .lastDuration=${this._lastDuration}
            .disableAtDate=${this._disableAtDate}
            .disableAtTime=${this._disableAtTime}
            .resumeAtDate=${this._resumeAtDate}
            .resumeAtTime=${this._resumeAtTime}
            @duration-change=${this._handleDurationChange}
            @schedule-mode-change=${this._handleScheduleModeChange}
            @schedule-field-change=${this._handleScheduleFieldChange}
            @custom-input-toggle=${this._handleCustomInputToggle}
          ></autosnooze-duration-selector>

          ${this._guardrailConfirmOpen ? html`
            <div class="guardrail-confirm" role="alertdialog" aria-live="polite">
              <div class="guardrail-title">${localize(this.hass, 'guardrail.confirm_title')}</div>
              <div class="guardrail-body">${localize(this.hass, 'guardrail.confirm_body')}</div>
              <div class="guardrail-actions">
                <button type="button" class="guardrail-cancel-btn" @click=${() => { this._guardrailConfirmOpen = false; }}>
                  ${localize(this.hass, 'button.cancel')}
                </button>
                <button type="button" class="guardrail-continue-btn" @click=${async () => { this._guardrailConfirmOpen = false; await this._snooze(true); }}>
                  ${localize(this.hass, 'button.continue')}
                </button>
              </div>
            </div>
          ` : ''}

          <button
            type="button"
            class="snooze-btn"
            ?disabled=${this._selected.length === 0 ||
            (!this._scheduleMode && !isDurationValid(this._customDurationInput)) ||
            (this._scheduleMode && !this._hasResumeAt()) ||
            this._loading}
            @click=${() => this._snooze()}
            aria-label="${this._loading
              ? localize(this.hass, 'a11y.snoozing')
              : this._scheduleMode
                ? localize(this.hass, 'a11y.schedule_snooze', { count: this._selected.length })
                : localize(this.hass, 'a11y.snooze_count', { count: this._selected.length })}"
            aria-busy=${this._loading}
          >
            ${this._loading
              ? localize(this.hass, 'button.snoozing')
              : this._scheduleMode
                ? localize(this.hass, 'button.schedule_count', { count: this._selected.length })
                : localize(this.hass, 'button.snooze_count', { count: this._selected.length })}
          </button>
        </div>

        ${pausedCount > 0
          ? html`<autosnooze-active-pauses
              .hass=${this.hass}
              .pauseGroups=${pausedSnapshot.groups}
              .pausedCount=${pausedCount}
              @wake-automation=${this._handleWakeEvent}
              @wake-all=${this._handleWakeAllEvent}
              @adjust-automation=${this._handleAdjustModalOpenEvent}
              @adjust-group=${this._handleAdjustModalOpenEvent}
            ></autosnooze-active-pauses>`
          : ''}
        ${renderScheduledPausesSection(
          this.hass,
          scheduledCount,
          scheduled,
          (isoString) => formatDateTime(isoString, this.hass?.locale?.language),
          (entityId) => void this._cancelScheduled(entityId),
        )}
        <autosnooze-adjust-modal
          .hass=${this.hass}
          .open=${this._adjustModalOpen}
          .entityId=${this._adjustModalEntityId}
          .friendlyName=${this._adjustModalFriendlyName}
          .resumeAt=${this._adjustModalResumeAt}
          .entityIds=${this._adjustModalEntityIds}
          .friendlyNames=${this._adjustModalFriendlyNames}
          @adjust-time=${this._handleAdjustTimeEvent}
          @close-modal=${this._handleCloseModalEvent}
        ></autosnooze-adjust-modal>
      </ha-card>
    `;
  }
}
