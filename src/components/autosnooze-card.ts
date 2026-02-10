/**
 * AutoSnooze Main Card Component.
 * A Lovelace card for temporarily pausing Home Assistant automations.
 */

import { LitElement, html, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant, HassLabel, HassCategory, HassEntityRegistryEntry, HassEntities, PausedAutomationAttribute, ScheduledSnoozeAttribute } from '../types/hass.js';
import type { AutoSnoozeCardConfig, HapticFeedbackType } from '../types/card.js';
import type { AutomationItem, ParsedDuration, PauseGroup, PauseServiceParams } from '../types/automation.js';
import { cardStyles } from '../styles/card.styles.js';
import { sharedPausedStyles } from '../styles/shared.styles.js';
import {
  TIME_MS,
  UI_TIMING,
  DEFAULT_SNOOZE_MINUTES,
} from '../constants/index.js';
import {
  formatDateTime,
  formatDuration,
  isDurationValid,
  durationToMinutes,
  getCurrentDateTime,
  combineDateTime,
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
  adjustSnooze,
  saveLastDuration,
  loadLastDuration,
  type LastDurationData,
} from '../services/index.js';
import {
  getAutomations,
} from '../state/automations.js';
import {
  getPaused,
  getScheduled,
  getPausedGroupedByResumeTime,
  SENSOR_ENTITY_ID,
} from '../state/paused.js';


export class AutomationPauseCard extends LitElement {
  static styles = [sharedPausedStyles, cardStyles];

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  config: AutoSnoozeCardConfig = {} as AutoSnoozeCardConfig;

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

    return false;
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
    const labels = await fetchLabelRegistry(this.hass);
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

  private _getPaused(): Record<string, PausedAutomationAttribute> {
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

  private async _callPauseWithGuardrailConfirm(params: PauseServiceParams, forceConfirm: boolean = false): Promise<boolean> {
    if (!this.hass) return false;
    if (forceConfirm) {
      await pauseAutomations(this.hass, { ...params, confirm: true });
      return true;
    }

    try {
      await pauseAutomations(this.hass, params);
      return true;
    } catch (error) {
      const serviceError = error as { translation_key?: string; data?: { translation_key?: string } };
      const translationKey = serviceError?.translation_key ?? serviceError?.data?.translation_key;
      if (translationKey === 'confirm_required') {
        this._guardrailConfirmOpen = true;
        return false;
      }
      throw error;
    }
  }

  private async _snooze(forceConfirm: boolean = false): Promise<void> {
    if (this._selected.length === 0 || this._loading) return;

    if (this._scheduleMode) {
      if (!this._hasResumeAt()) {
        this._showToast(localize(this.hass, 'toast.error.resume_time_required'));
        return;
      }

      const disableAt = this._hasDisableAt()
        ? combineDateTime(this._disableAtDate, this._disableAtTime)
        : null;
      const resumeAt = combineDateTime(this._resumeAtDate, this._resumeAtTime);

      if (!resumeAt) {
        this._showToast(localize(this.hass, 'toast.error.invalid_datetime'));
        return;
      }

      const nowWithBuffer = Date.now() + UI_TIMING.TIME_VALIDATION_BUFFER_MS;
      const resumeTime = new Date(resumeAt).getTime();

      if (resumeTime <= nowWithBuffer) {
        this._showToast(localize(this.hass, 'toast.error.resume_time_past'));
        return;
      }

      if (disableAt) {
        const disableTime = new Date(disableAt).getTime();
        if (disableTime >= resumeTime) {
          this._showToast(localize(this.hass, 'toast.error.snooze_before_resume'));
          return;
        }
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

        const didPause = await this._callPauseWithGuardrailConfirm({
          entity_id: this._selected,
          resume_at: resumeAt,
          ...(disableAt && { disable_at: disableAt }),
        }, forceConfirm);
        if (!didPause) {
          this._loading = false;
          return;
        }

        if (!this.isConnected || !this.shadowRoot) {
          this._loading = false;
          return;
        }

        if (disableAt) {
          toastMessage = count === 1
            ? localize(this.hass, 'toast.success.scheduled_one')
            : localize(this.hass, 'toast.success.scheduled_many', { count });
        } else {
          const formattedTime = this._formatDateTime(resumeAt);
          toastMessage = count === 1
            ? localize(this.hass, 'toast.success.snoozed_until_one', { time: formattedTime })
            : localize(this.hass, 'toast.success.snoozed_until_many', { count, time: formattedTime });
        }
      } else {
        const { days, hours, minutes } = this._customDuration;

        const didPause = await this._callPauseWithGuardrailConfirm({
          entity_id: this._selected,
          days,
          hours,
          minutes,
        }, forceConfirm);
        if (!didPause) {
          this._loading = false;
          return;
        }

        if (!this.isConnected || !this.shadowRoot) {
          this._loading = false;
          return;
        }

        const durationText = formatDuration(days, hours, minutes);
        toastMessage = count === 1
          ? localize(this.hass, 'toast.success.snoozed_for_one', { duration: durationText })
          : localize(this.hass, 'toast.success.snoozed_for_many', { count, duration: durationText });

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
                ? localize(this.hass, 'toast.success.restored_one')
                : localize(this.hass, 'toast.success.restored_many', { count });
              this._showToast(restoredMsg);
            }
          } catch (e) {
            console.error('Undo failed:', e);
            if (this.isConnected && this.shadowRoot) {
              this._showToast(localize(this.hass, 'toast.error.undo_failed'));
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
        this._showToast(localize(this.hass, 'toast.success.resumed'));
      }
    } catch (e) {
      console.error('Wake failed:', e);
      this._hapticFeedback('failure');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(getErrorMessage(e as Error, localize(this.hass, 'toast.error.resume_failed')));
      }
    }
  }

  private async _handleWakeEvent(e: CustomEvent<{ entityId: string }>): Promise<void> {
    await this._wake(e.detail.entityId);
  }

  private async _handleWakeAllEvent(): Promise<void> {
    if (!this.hass) return;
    try {
      await wakeAll(this.hass);
      this._hapticFeedback('success');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(localize(this.hass, 'toast.success.resumed_all'));
      }
    } catch (e) {
      console.error('Wake all failed:', e);
      this._hapticFeedback('failure');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(getErrorMessage(e as Error, localize(this.hass, 'toast.error.resume_all_failed')));
      }
    }
  }


  private _handleAdjustAutomationEvent(e: CustomEvent<{ entityId: string; friendlyName: string; resumeAt: string }>): void {
    this._adjustModalOpen = true;
    this._adjustModalEntityId = e.detail.entityId;
    this._adjustModalFriendlyName = e.detail.friendlyName;
    this._adjustModalResumeAt = e.detail.resumeAt;
    this._adjustModalEntityIds = [];
    this._adjustModalFriendlyNames = [];
  }

  private _handleAdjustGroupEvent(
    e: CustomEvent<{ entityIds: string[]; friendlyNames: string[]; resumeAt: string }>
  ): void {
    this._adjustModalOpen = true;
    this._adjustModalEntityIds = e.detail.entityIds;
    this._adjustModalFriendlyNames = e.detail.friendlyNames;
    this._adjustModalEntityId = '';
    this._adjustModalFriendlyName = '';
    this._adjustModalResumeAt = e.detail.resumeAt;
  }

  private async _handleAdjustTimeEvent(
    e: CustomEvent<{ entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number }>
  ): Promise<void> {
    if (!this.hass) return;
    const { entityId, entityIds, ...params } = e.detail;
    const target = entityIds || entityId || '';
    try {
      await adjustSnooze(this.hass, target, params);
      this._hapticFeedback('success');

      // Optimistic UI update: compute new resumeAt locally
      const deltaMs =
        ((params.days || 0) * TIME_MS.DAY) +
        ((params.hours || 0) * TIME_MS.HOUR) +
        ((params.minutes || 0) * TIME_MS.MINUTE);
      const currentResumeAt = new Date(this._adjustModalResumeAt).getTime();
      this._adjustModalResumeAt = new Date(currentResumeAt + deltaMs).toISOString();

      if (this.isConnected && this.shadowRoot) {
        this._showToast(localize(this.hass, 'toast.success.adjusted'));
      }
    } catch (e) {
      console.error('Adjust failed:', e);
      this._hapticFeedback('failure');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(getErrorMessage(e as Error, localize(this.hass, 'toast.error.adjust_failed')));
      }
    }
  }

  private _handleCloseModalEvent(): void {
    this._adjustModalOpen = false;
    this._adjustModalEntityId = '';
    this._adjustModalFriendlyName = '';
    this._adjustModalResumeAt = '';
    this._adjustModalEntityIds = [];
    this._adjustModalFriendlyNames = [];
  }

  private async _cancelScheduled(entityId: string): Promise<void> {
    if (!this.hass) return;
    try {
      await cancelScheduled(this.hass, entityId);
      this._hapticFeedback('success');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(localize(this.hass, 'toast.success.cancelled'));
      }
    } catch (e) {
      console.error('Cancel scheduled failed:', e);
      this._hapticFeedback('failure');
      if (this.isConnected && this.shadowRoot) {
        this._showToast(getErrorMessage(e as Error, localize(this.hass, 'toast.error.cancel_failed')));
      }
    }
  }

  private _handleDurationChange(e: CustomEvent<{ minutes: number; duration: ParsedDuration; input: string; showCustomInput?: boolean }>): void {
    const { minutes, duration, input, showCustomInput } = e.detail;
    this._duration = minutes * TIME_MS.MINUTE;
    this._customDuration = duration;
    this._customDurationInput = input;
    if (showCustomInput !== undefined) {
      this._showCustomInput = showCustomInput;
    }
  }

  private _handleScheduleModeChange(e: CustomEvent<{ enabled: boolean }>): void {
    this._scheduleMode = e.detail.enabled;
    if (e.detail.enabled) {
      const now = new Date();
      const { date, time } = getCurrentDateTime();
      const resumeMinutes = this._lastDuration?.minutes ?? DEFAULT_SNOOZE_MINUTES;
      const resumeDate = new Date(now.getTime() + (resumeMinutes * TIME_MS.MINUTE));

      const resumeYear = resumeDate.getFullYear();
      const resumeMonth = String(resumeDate.getMonth() + 1).padStart(2, '0');
      const resumeDay = String(resumeDate.getDate()).padStart(2, '0');
      const resumeHours = String(resumeDate.getHours()).padStart(2, '0');
      const resumeMins = String(resumeDate.getMinutes()).padStart(2, '0');

      this._disableAtDate = date;
      this._disableAtTime = time;
      this._resumeAtDate = `${resumeYear}-${resumeMonth}-${resumeDay}`;
      this._resumeAtTime = `${resumeHours}:${resumeMins}`;
    }
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
    this._selected = e.detail.selected;
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

    const paused = this._getPaused();
    const pausedCount = Object.keys(paused).length;
    const scheduled = this._getScheduled();
    const scheduledCount = Object.keys(scheduled).length;
    const automations = this._getAutomations();

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

        <div class="snooze-setup">
          <autosnooze-automation-list
            .hass=${this.hass}
            .automations=${automations}
            .selected=${this._selected}
            .labelRegistry=${this._labelRegistry}
            .labelRegistryUnavailable=${this._labelRegistryUnavailable}
            .categoryRegistry=${this._categoryRegistry}
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
              .pauseGroups=${this._getPausedGroupedByResumeTime()}
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
