/**
 * AutoSnooze Main Card Component.
 * A Lovelace card for temporarily pausing Home Assistant automations.
 */

import { LitElement, html, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant, PausedAutomationAttribute, ScheduledSnoozeAttribute } from '../types/hass.js';
import type { AutoSnoozeCardConfig, HapticFeedbackType } from '../types/card.js';
import type { AutomationItem, NotificationTrigger, ParsedDuration, PauseGroup } from '../types/automation.js';
import { cardStyles } from '../styles/card.styles.js';
import { sharedPausedStyles } from '../styles/shared.styles.js';
import {
  TIME_MS,
  UI_TIMING,
  DEFAULT_SNOOZE_MINUTES,
  NOTIFICATION_LEAD_OPTIONS,
  DEFAULT_NOTIFICATION_LEAD_MINUTES,
} from '../constants/index.js';
import {
  createCardUiStore,
  createAdjustModalState,
  createClosedAdjustModalState,
  getCardPausedSnapshot,
  isCardSnoozeSensorAvailable,
  loadCardLastDuration,
  loadCardRecentSnoozeIds,
  createScheduleModeState,
  type LastDurationData,
} from '../features/card-shell/index.js';
import { formatDateTime, formatDuration } from '../utils/time-formatting.js';
import { isDurationValid, minutesToDuration } from '../utils/duration-parsing.js';
import { hapticFeedback } from '../utils/haptic.js';
import { defineAutoSnoozeElement } from '../utils/custom-element-registration.js';
import { runPauseFeature } from '../features/pause/index.js';
import {
  runUndoFeature,
  runClearNotificationFeature,
  runWakeAllFeature,
  runWakeFeature,
} from '../features/resume/index.js';
import {
  runAdjustFeature,
  runCancelScheduledFeature,
} from '../features/scheduled-snooze/index.js';
import { CardShellController } from '../features/card-shell/controller.js';
import type { AutoSnoozeToast } from './autosnooze-toast.js';
import './autosnooze-toast.js';
import './autosnooze-scheduled-pauses.js';


export class AutomationPauseCard extends LitElement {
  static styles = [sharedPausedStyles, cardStyles];

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  config: AutoSnoozeCardConfig = {} as AutoSnoozeCardConfig;

  private _cardStore = createCardUiStore();
  private _shell = new CardShellController(() => this.requestUpdate());

  @state() private _selected: string[] = [];
  @state() private _duration: number = DEFAULT_SNOOZE_MINUTES * TIME_MS.MINUTE;
  @state() private _customDuration: ParsedDuration = { days: 0, hours: 0, minutes: DEFAULT_SNOOZE_MINUTES };
  @state() private _customDurationInput: string = '30m';
  @state() private _loading: boolean = false;
  @state() private _scheduleMode: boolean = false;
  @state() private _notificationsEnabled: boolean = false;
  @state() private _notificationTrigger: Exclude<NotificationTrigger, 'none'> = 'end';
  @state() private _notificationLeadMinutes: number = DEFAULT_NOTIFICATION_LEAD_MINUTES;
  @state() private _disableAtDate: string = '';
  @state() private _disableAtTime: string = '';
  @state() private _resumeAtDate: string = '';
  @state() private _resumeAtTime: string = '';
  @state() private _showCustomInput: boolean = false;
  @state() private _lastDuration: LastDurationData | null = null;
  @state() _recentSnoozeIds: string[] = [];
  @state() private _adjustModalOpen: boolean = false;
  @state() private _adjustModalEntityId: string = '';
  @state() private _adjustModalFriendlyName: string = '';
  @state() private _adjustModalResumeAt: string = '';
  @state() private _adjustModalEntityIds: string[] = [];
  @state() private _adjustModalFriendlyNames: string[] = [];
  @state() private _guardrailConfirmOpen: boolean = false;


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
    return !changedProps.has('hass')
      || this._shell.shouldUpdate(changedProps.get('hass') as HomeAssistant | undefined, this.hass);
  }

  willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (changedProps.has('hass')) {
      this._syncAdjustModalWithPausedState();
    }
  }

  updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('hass') && this.hass) void this._shell.connect(this.hass);
  }

  private _syncAdjustModalWithPausedState(): void {
    if (!this._adjustModalOpen) {
      return;
    }

    const paused = this._getPaused();

    if (this._adjustModalEntityIds.length > 0) {
      const anyStillPaused = this._adjustModalEntityIds.some(id => paused[id]);
      if (!anyStillPaused) {
        this._handleCloseModalEvent();
        return;
      }

      const firstPaused = this._adjustModalEntityIds.find(id => paused[id]);
      if (firstPaused) {
        const pausedData = paused[firstPaused] as { resume_at?: string } | undefined;
        if (pausedData?.resume_at && pausedData.resume_at !== this._adjustModalResumeAt) {
          this._adjustModalResumeAt = pausedData.resume_at;
        }
      }
      return;
    }

    if (this._adjustModalEntityId) {
      const pausedData = paused[this._adjustModalEntityId] as { resume_at?: string } | undefined;
      if (pausedData?.resume_at && pausedData.resume_at !== this._adjustModalResumeAt) {
        this._adjustModalResumeAt = pausedData.resume_at;
      }
      if (!pausedData) {
        this._handleCloseModalEvent();
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.hass) void this._shell.connect(this.hass);
    this._lastDuration = loadCardLastDuration();
    this._refreshRecentSnoozeIds();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._shell.disconnect();
  }

  private _refreshRecentSnoozeIds(): void {
    this._recentSnoozeIds = loadCardRecentSnoozeIds();
  }

  private _getAutomations(): AutomationItem[] {
    return this.hass ? this._shell.getAutomations(this.hass) : [];
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
    return getCardPausedSnapshot(this.hass);
  }

  private _isSnoozeSensorAvailable(): boolean {
    return isCardSnoozeSensorAvailable(this.hass);
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
    this.shadowRoot?.querySelector<AutoSnoozeToast>('autosnooze-toast')?.show(
      message,
      localize(this.hass, 'button.undo'),
      localize(this.hass, 'a11y.undo_action'),
      options.showUndo ? options.onUndo ?? undefined : undefined,
    );
  }

  private async _snooze(forceConfirm: boolean = false): Promise<void> {
    if (this._selected.length === 0 || this._loading) return;

    if (!this._scheduleMode && this._duration === 0) return;

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
        automations: this._getAutomations(),
        labelRegistry: this._shell.labels,
        nowMs: Date.now() + UI_TIMING.TIME_VALIDATION_BUFFER_MS,
        ...(this._notificationsEnabled && {
          notificationTrigger: this._notificationTrigger,
          ...(this._notificationTrigger === 'about_to_end' && {
            notificationLeadMinutes: this._notificationLeadMinutes,
          }),
        }),
      });

      if (pauseResult.status === 'confirm_required') {
        this._guardrailConfirmOpen = true;
        this._loading = false;
        return;
      }

      if (pauseResult.status === 'validation_error') {
        this._showToast(pauseResult.toastMessage);
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
      this._notificationsEnabled = false;
      this._notificationTrigger = 'end';
      this._notificationLeadMinutes = DEFAULT_NOTIFICATION_LEAD_MINUTES;
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

  private async _handleClearNotificationEvent(
    e: CustomEvent<{ entityId: string }>
  ): Promise<void> {
    if (!this.hass) return;
    try {
      await runClearNotificationFeature(this.hass, e.detail.entityId);
      this._hapticFeedback('success');
    } catch (err) {
      console.error('Clear notification failed:', err);
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

  private _handleNotificationsToggle(e: Event): void {
    this._notificationsEnabled = (e.target as HTMLInputElement).checked;
  }

  private _handleNotificationWhenChange(e: Event): void {
    this._notificationTrigger = (e.target as HTMLSelectElement).value as Exclude<NotificationTrigger, 'none'>;
  }

  private _handleNotificationLeadChange(e: Event): void {
    this._notificationLeadMinutes = Number((e.target as HTMLSelectElement).value);
  }

  private _formatLeadLabel(minutes: number): string {
    const { days, hours, minutes: mins } = minutesToDuration(minutes);
    return formatDuration(days, hours, mins);
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
            .labelRegistry=${this._shell.labels}
            .labelRegistryUnavailable=${this._shell.labelsUnavailable}
            .categoryRegistry=${this._shell.categories}
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

          <div class="notify-section">
            <label class="notify-toggle">
              <input
                type="checkbox"
                .checked=${this._notificationsEnabled}
                @change=${this._handleNotificationsToggle}
              />
              <ha-icon icon="mdi:bell-outline" aria-hidden="true"></ha-icon>
              <span class="notify-toggle-text">
                ${localize(this.hass, 'notify.toggle_label')}
              </span>
            </label>

            ${this._notificationsEnabled ? html`
              <div class="notify-detail">
                <label class="notify-field">
                  <span class="notify-field-label visually-hidden">${localize(this.hass, 'notify.when_label')}</span>
                  <select
                    .value=${this._notificationTrigger}
                    @change=${this._handleNotificationWhenChange}
                  >
                    <option value="start">${localize(this.hass, 'notify.when.start')}</option>
                    <option value="about_to_end">${localize(this.hass, 'notify.when.about_to_end')}</option>
                    <option value="end">${localize(this.hass, 'notify.when.end')}</option>
                  </select>
                </label>

                ${this._notificationTrigger === 'about_to_end' ? html`
                  <label class="notify-field">
                    <span class="notify-field-label visually-hidden">${localize(this.hass, 'notify.lead_label')}</span>
                    <select
                      .value=${String(this._notificationLeadMinutes)}
                      @change=${this._handleNotificationLeadChange}
                    >
                      ${NOTIFICATION_LEAD_OPTIONS.map(
                        (m) => html`<option value=${String(m)}>${this._formatLeadLabel(m)}</option>`
                      )}
                    </select>
                  </label>
                ` : ''}
              </div>
            ` : ''}
          </div>

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
              @clear-notification=${this._handleClearNotificationEvent}
              @adjust-automation=${this._handleAdjustAutomationEvent}
              @adjust-group=${this._handleAdjustGroupEvent}
            ></autosnooze-active-pauses>`
          : ''}
        <autosnooze-scheduled-pauses
          .hass=${this.hass}
          .scheduled=${scheduled}
          @cancel-scheduled=${(event: CustomEvent<{ entityId: string }>) => this._cancelScheduled(event.detail.entityId)}
        ></autosnooze-scheduled-pauses>
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
        <autosnooze-toast></autosnooze-toast>
      </ha-card>
    `;
  }
}

defineAutoSnoozeElement('autosnooze-card', AutomationPauseCard);
