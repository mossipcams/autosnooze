/**
 * AutoSnooze Main Card Component.
 * A Lovelace card for temporarily pausing Home Assistant automations.
 */

import { LitElement, html, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant, HassLabel, HassCategory, HassEntityRegistryEntry, HassEntities, PausedAutomationAttribute, ScheduledSnoozeAttribute } from '../types/hass.js';
import type { AutoSnoozeCardConfig, HapticFeedbackType } from '../types/card.js';
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
import { requiresPauseConfirmation, runPauseFeature } from '../features/pause/index.js';
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
  getAutomations,
} from '../features/automation-list/index.js';
import {
  getPausedSnapshot,
  SENSOR_ENTITY_ID,
} from '../state/paused.js';
import { createCardStore } from '../state/card-store.js';


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
  private _lastAutomationFingerprintStates: HassEntities | null = null;
  private _lastAutomationFingerprint: string = '';
  private _lastHassStates: HassEntities | null = null;
  private _lastCacheVersion: number = 0;
  private _toastTimeout: number | null = null;
  private _toastFadeTimeout: number | null = null;
  private _labelRegistryRetryTimeout: number | null = null;
  private _labelRegistryRetryDelayMs: number = UI_TIMING.REGISTRY_RETRY_MIN_MS;

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

    return this._haveAutomationStatesChanged(oldStates, newStates);
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
      const paused = this._getPaused();

      if (this._adjustModalEntityIds.length > 0) {
        // Group mode: close only when ALL entities are no longer paused
        const anyStillPaused = this._adjustModalEntityIds.some(id => paused[id]);
        if (!anyStillPaused) {
          this._handleCloseModalEvent();
        }
        // Sync resumeAt from first still-paused entity (they share the same resumeAt)
        const firstPaused = this._adjustModalEntityIds.find(id => paused[id]);
        if (firstPaused) {
          const pausedData = paused[firstPaused] as { resume_at?: string } | undefined;
          if (pausedData?.resume_at && pausedData.resume_at !== this._adjustModalResumeAt) {
            this._adjustModalResumeAt = pausedData.resume_at;
          }
        }
      } else if (this._adjustModalEntityId) {
        // Single mode: existing logic
        const pausedData = paused[this._adjustModalEntityId] as { resume_at?: string } | undefined;
        if (pausedData?.resume_at && pausedData.resume_at !== this._adjustModalResumeAt) {
          this._adjustModalResumeAt = pausedData.resume_at;
        }
        if (!pausedData) {
          this._handleCloseModalEvent();
        }
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();

    this._fetchLabelRegistry();
    this._fetchCategoryRegistry();
    this._fetchEntityRegistry();
    this._lastDuration = loadLastDuration();
    this._refreshRecentSnoozeIds();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._toastTimeout !== null) {
      clearTimeout(this._toastTimeout);
      this._toastTimeout = null;
    }
    if (this._toastFadeTimeout !== null) {
      clearTimeout(this._toastFadeTimeout);
      this._toastFadeTimeout = null;
    }
    if (this._labelRegistryRetryTimeout !== null) {
      clearTimeout(this._labelRegistryRetryTimeout);
      this._labelRegistryRetryTimeout = null;
    }
  }


  private async _fetchLabelRegistry(): Promise<void> {
    if (this._labelsFetched || !this.hass?.connection) return;
    if (this._labelRegistryFetchPromise) {
      await this._labelRegistryFetchPromise;
      return;
    }

    this._labelRegistryFetchPromise = (async () => {
      const labels = await fetchLabelRegistry(this.hass!);
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
    })();

    try {
      await this._labelRegistryFetchPromise;
    } finally {
      this._labelRegistryFetchPromise = null;
    }
  }

  private async _fetchCategoryRegistry(): Promise<void> {
    if (this._categoriesFetched || !this.hass?.connection) return;
    if (this._categoryRegistryFetchPromise) {
      await this._categoryRegistryFetchPromise;
      return;
    }

    this._categoryRegistryFetchPromise = (async () => {
      this._categoryRegistry = await fetchCategoryRegistry(this.hass!);
      this._categoriesFetched = true;
    })();

    try {
      await this._categoryRegistryFetchPromise;
    } finally {
      this._categoryRegistryFetchPromise = null;
    }
  }

  private async _fetchEntityRegistry(): Promise<void> {
    if (this._entityRegistryFetched || !this.hass?.connection) return;
    if (this._entityRegistryFetchPromise) {
      await this._entityRegistryFetchPromise;
      return;
    }

    this._entityRegistryFetchPromise = (async () => {
      this._entityRegistry = await fetchEntityRegistry(this.hass!);
      this._entityRegistryFetched = true;
      this._automationsCacheVersion++;
    })();

    try {
      await this._entityRegistryFetchPromise;
    } finally {
      this._entityRegistryFetchPromise = null;
    }
  }

  private _refreshRecentSnoozeIds(): void {
    this._recentSnoozeIds = loadRecentSnoozes();
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

  private _getAutomationStateFingerprint(states: HassEntities): string {
    if (this._lastAutomationFingerprintStates === states) {
      return this._lastAutomationFingerprint;
    }

    const automationIds = Object.keys(states)
      .filter((entityId) => entityId.startsWith('automation.'))
      .sort();

    const fingerprint = automationIds
      .map((entityId) => {
        const entity = states[entityId] as { state?: string; last_changed?: string; last_updated?: string } | undefined;
        return `${entityId}:${entity?.state ?? ''}:${entity?.last_changed ?? ''}:${entity?.last_updated ?? ''}`;
      })
      .join('|');

    this._lastAutomationFingerprintStates = states;
    this._lastAutomationFingerprint = fingerprint;
    return fingerprint;
  }

  private _haveAutomationStatesChanged(oldStates: HassEntities, newStates: HassEntities): boolean {
    let oldAutomationCount = 0;

    for (const [entityId, oldState] of Object.entries(oldStates)) {
      if (!entityId.startsWith('automation.')) {
        continue;
      }

      oldAutomationCount += 1;
      if (!(entityId in newStates)) {
        return true;
      }

      if (newStates[entityId] !== oldState) {
        return true;
      }
    }

    let newAutomationCount = 0;
    for (const entityId of Object.keys(newStates)) {
      if (entityId.startsWith('automation.')) {
        newAutomationCount += 1;
      }
    }

    return oldAutomationCount !== newAutomationCount;
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

  private _isSnoozeSensorAvailable(): boolean {
    return Boolean(this.hass?.states?.[SENSOR_ENTITY_ID]);
  }

  private _formatDateTime(isoString: string): string {
    return formatDateTime(isoString, this._getLocale());
  }

  private _getLocale(): string | undefined {
    return this.hass?.locale?.language;
  }


  private _hasResumeAt(): boolean {
    return Boolean(this._resumeAtDate && this._resumeAtTime);
  }

  private _hasDisableAt(): boolean {
    return Boolean(this._disableAtDate && this._disableAtTime);
  }


  private _hapticFeedback(type: HapticFeedbackType = 'light'): void {
    hapticFeedback(type);
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
      undoBtn.textContent = localize(this.hass, 'button.undo');
      undoBtn.setAttribute('aria-label', localize(this.hass, 'a11y.undo_action'));
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

  private async _snooze(forceConfirm: boolean = false): Promise<void> {
    if (this._selected.length === 0 || this._loading) return;

    if (this._scheduleMode) {
      if (!this._hasResumeAt()) {
        this._showToast(localize(this.hass, 'toast.error.resume_time_required'));
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
        const message = scheduleValidation.message === 'Resume time is required'
          ? localize(this.hass, 'toast.error.invalid_datetime')
          : scheduleValidation.message === 'Resume time must be in the future'
            ? localize(this.hass, 'toast.error.resume_time_past')
            : localize(this.hass, 'toast.error.snooze_before_resume');
        this._showToast(message);
        return;
      }
    } else {
      if (this._duration === 0) return;
    }

    if (!forceConfirm && requiresPauseConfirmation({
      selected: this._selected,
      automations: this._getAutomations(),
      labelRegistry: this._labelRegistry,
    })) {
      this._guardrailConfirmOpen = true;
      return;
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

      this._refreshRecentSnoozeIds();

      if (!this.isConnected || !this.shadowRoot) {
        this._loading = false;
        return;
      }

      this._hapticFeedback('success');

      this._showToast(pauseResult.toastMessage, {
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
                this._showToast(restoredMsg);
              } else {
                // Keep only failed entities selected to make retry easier.
                this._setSelected(undoResult.failed);
                this._showToast(localize(this.hass, 'toast.error.undo_failed'));
              }
            }
          } catch (e) {
            console.error('Undo failed:', e);
            if (this.isConnected && this.shadowRoot) {
              this._showToast(localize(this.hass, 'toast.error.undo_failed'));
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
    }
    this._loading = false;
  }

  private async _wake(entityId: string): Promise<void> {
    if (!this.hass) return;
    try {
      await runWakeFeature(this.hass, entityId);
      this._hapticFeedback('success');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(localize(this.hass, 'toast.success.resumed'));
      }
    } catch (e) {
      console.error('Wake failed:', e);
      this._hapticFeedback('failure');
    }
  }

  private async _handleWakeEvent(e: CustomEvent<{ entityId: string }>): Promise<void> {
    await this._wake(e.detail.entityId);
  }

  private async _handleWakeAllEvent(): Promise<void> {
    if (!this.hass) return;
    try {
      await runWakeAllFeature(this.hass);
      this._hapticFeedback('success');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(localize(this.hass, 'toast.success.resumed_all'));
      }
    } catch (e) {
      console.error('Wake all failed:', e);
      this._hapticFeedback('failure');
    }
  }


  private _handleAdjustAutomationEvent(e: CustomEvent<{ entityId: string; friendlyName: string; resumeAt: string }>): void {
    const state = createAdjustModalState({
      entityId: e.detail.entityId,
      friendlyName: e.detail.friendlyName,
      resumeAt: e.detail.resumeAt,
    });
    this._adjustModalOpen = state.adjustModalOpen;
    this._adjustModalEntityId = state.adjustModalEntityId;
    this._adjustModalFriendlyName = state.adjustModalFriendlyName;
    this._adjustModalResumeAt = state.adjustModalResumeAt;
    this._adjustModalEntityIds = state.adjustModalEntityIds;
    this._adjustModalFriendlyNames = state.adjustModalFriendlyNames;
  }

  private _handleAdjustGroupEvent(
    e: CustomEvent<{ entityIds: string[]; friendlyNames: string[]; resumeAt: string }>
  ): void {
    const state = createAdjustModalState({
      entityIds: e.detail.entityIds,
      friendlyNames: e.detail.friendlyNames,
      resumeAt: e.detail.resumeAt,
    });
    this._adjustModalOpen = state.adjustModalOpen;
    this._adjustModalEntityIds = state.adjustModalEntityIds;
    this._adjustModalFriendlyNames = state.adjustModalFriendlyNames;
    this._adjustModalEntityId = state.adjustModalEntityId;
    this._adjustModalFriendlyName = state.adjustModalFriendlyName;
    this._adjustModalResumeAt = state.adjustModalResumeAt;
  }

  private async _handleAdjustTimeEvent(
    e: CustomEvent<{ entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number }>
  ): Promise<void> {
    if (!this.hass) return;
    try {
      const adjustResult = await runAdjustFeature(this.hass, e.detail, this._adjustModalResumeAt);
      this._hapticFeedback('success');
      this._adjustModalResumeAt = adjustResult.nextResumeAt;

      if (this.isConnected && this.shadowRoot) {
        this._showToast(localize(this.hass, 'toast.success.adjusted'));
      }
    } catch (e) {
      console.error('Adjust failed:', e);
      this._hapticFeedback('failure');
    }
  }

  private _handleCloseModalEvent(): void {
    const state = createClosedAdjustModalState();
    this._adjustModalOpen = state.adjustModalOpen;
    this._adjustModalEntityId = state.adjustModalEntityId;
    this._adjustModalFriendlyName = state.adjustModalFriendlyName;
    this._adjustModalResumeAt = state.adjustModalResumeAt;
    this._adjustModalEntityIds = state.adjustModalEntityIds;
    this._adjustModalFriendlyNames = state.adjustModalFriendlyNames;
  }

  private async _cancelScheduled(entityId: string): Promise<void> {
    if (!this.hass) return;
    try {
      await runCancelScheduledFeature(this.hass, entityId);
      this._hapticFeedback('success');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(localize(this.hass, 'toast.success.cancelled'));
      }
    } catch (e) {
      console.error('Cancel scheduled failed:', e);
      this._hapticFeedback('failure');
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
    switch (field) {
      case 'disableAtDate':
        this._disableAtDate = value;
        break;
      case 'disableAtTime':
        this._disableAtTime = value;
        break;
      case 'resumeAtDate':
        this._resumeAtDate = value;
        break;
      case 'resumeAtTime':
        this._resumeAtTime = value;
        break;
    }
  }

  private _handleCustomInputToggle(e: CustomEvent<{ show: boolean }>): void {
    this._showCustomInput = e.detail.show;
  }

  private _handleSelectionChange(e: CustomEvent<{ selected: string[] }>): void {
    this._setSelected(e.detail.selected);
  }

  private _handleGuardrailCancel(): void {
    this._guardrailConfirmOpen = false;
  }

  private async _handleGuardrailContinue(): Promise<void> {
    this._guardrailConfirmOpen = false;
    await this._snooze(true);
  }

  private _renderScheduledPauses(scheduledCount: number, scheduled: Record<string, { friendly_name?: string; disable_at?: string; resume_at: string }>): TemplateResult | string {
    if (scheduledCount === 0) return '';

    return html`
      <div class="scheduled-list" role="region" aria-label="${localize(this.hass, 'a11y.scheduled_region')}">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          ${localize(this.hass, 'section.scheduled_count', { count: scheduledCount })}
        </div>

        ${Object.entries(scheduled).map(
          ([id, data]) => html`
            <div class="scheduled-item" role="article" aria-label="${localize(this.hass, 'a11y.scheduled_pause_for', { name: data.friendly_name || id })}">
              <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
              <div class="paused-info">
                <div class="paused-name">
                  ${data.friendly_name || id}
                </div>
                <div class="scheduled-time">
                  ${localize(this.hass, 'status.disables')} ${this._formatDateTime(data.disable_at || 'now')}
                </div>
                <div class="paused-time">
                  ${localize(this.hass, 'status.resumes_at')} ${this._formatDateTime(data.resume_at)}
                </div>
              </div>
              <button type="button" class="cancel-scheduled-btn" @click=${() => this._cancelScheduled(id)} aria-label="${localize(this.hass, 'a11y.cancel_scheduled_for', { name: data.friendly_name || id })}">
                ${localize(this.hass, 'button.cancel')}
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

    const pausedSnapshot = this._getPausedSnapshot();
    const paused = pausedSnapshot.paused;
    const pausedCount = Object.keys(paused).length;
    const scheduled = pausedSnapshot.scheduled;
    const scheduledCount = Object.keys(scheduled).length;
    const automations = this._getAutomations();
    const sensorAvailable = this._isSnoozeSensorAvailable();

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
            @selection-change=${this._handleSelectionChange}
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
                <button type="button" class="guardrail-cancel-btn" @click=${() => this._handleGuardrailCancel()}>
                  ${localize(this.hass, 'button.cancel')}
                </button>
                <button type="button" class="guardrail-continue-btn" @click=${() => this._handleGuardrailContinue()}>
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
              @adjust-automation=${this._handleAdjustAutomationEvent}
              @adjust-group=${this._handleAdjustGroupEvent}
            ></autosnooze-active-pauses>`
          : ''}
        ${this._renderScheduledPauses(scheduledCount, scheduled)}
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
