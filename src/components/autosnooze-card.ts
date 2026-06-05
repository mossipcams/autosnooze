/**
 * AutoSnooze Main Card Component.
 * A Lovelace card for temporarily pausing Home Assistant automations.
 */

import { LitElement, html, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant } from '../types/hass.js';
import type { AutoSnoozeCardConfig } from '../types/card.js';
import { cardStyles } from '../styles/card.styles.js';
import { sharedPausedStyles } from '../styles/shared.styles.js';
import {
  NOTIFICATION_LEAD_OPTIONS,
} from '../constants/index.js';
import {
  createCardController,
  type CardController,
  type CardControllerViewModel,
} from '../features/card-controller/index.js';
import { isDurationValid } from '../utils/duration-parsing.js';
import { defineAutoSnoozeElement } from '../utils/custom-element-registration.js';

interface CardControllerCompatibility {
  _labelRegistryFetchPromise: Promise<void> | null;
  _categoryRegistryFetchPromise: Promise<void> | null;
  _entityRegistryFetchPromise: Promise<void> | null;
  _toastTimeout: number | null;
  _toastFadeTimeout: number | null;
  _haveAutomationStatesChanged(oldStates: import('../types/hass.js').HassEntities, newStates: import('../types/hass.js').HassEntities): boolean;
  _syncAdjustModalWithPausedState(): void;
  _viewModel: CardControllerViewModel;
}

export class AutomationPauseCard extends LitElement {
  static styles = [sharedPausedStyles, cardStyles];

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  config: AutoSnoozeCardConfig = {} as AutoSnoozeCardConfig;

  @state() private _viewModel: CardControllerViewModel;

  private _controller: CardController = createCardController();
  private _unsubscribe?: () => void;

  constructor() {
    super();
    this._viewModel = this._controller.getViewModel();
    this._unsubscribe = this._controller.subscribe(() => {
      this._viewModel = this._controller.getViewModel();
      this.requestUpdate();
    });
  }

  static getConfigElement(): HTMLElement {
    return document.createElement('autosnooze-card-editor');
  }

  static getStubConfig(): AutoSnoozeCardConfig {
    return { type: 'custom:autosnooze-card', title: 'AutoSnooze' };
  }

  setConfig(config: AutoSnoozeCardConfig): void {
    this.config = config;
    this._controller.setConfig(config);
  }

  willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (changedProps.has('hass')) {
      this._controller.setHass(this.hass);
      this._viewModel = this._controller.getViewModel();
    }
    if (changedProps.has('config')) {
      this._controller.setConfig(this.config);
    }
  }

  shouldUpdate(changedProps: PropertyValues): boolean {
    if (!changedProps.has('hass')) {
      return true;
    }

    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    return this._controller.shouldUpdateHass(oldHass, this.hass);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = this._controller.subscribe(() => {
      this._viewModel = this._controller.getViewModel();
      this.requestUpdate();
    });
    this._controller.connect(this.hass);
    this._viewModel = this._controller.getViewModel();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._controller.disconnect();
    this._unsubscribe?.();
    this._unsubscribe = undefined;
  }

  // Backward-compatible accessors used by existing card UI tests.
  get _selected(): string[] { return this._viewModel.local.selected; }
  set _selected(value: string[]) { this._controller.setSelection(value); }
  get _scheduleMode(): boolean { return this._viewModel.local.scheduleMode; }
  set _scheduleMode(value: boolean) { this._controller.setScheduleMode(value); }
  get _loading(): boolean { return this._viewModel.local.loading; }
  set _loading(value: boolean) { this._controller.loading = value; }
  set _labelsFetched(value: boolean) { this._controller.labelsFetched = value; }
  set _labelRegistryRetryTimeout(value: number | null) { this._controller.labelRegistryRetryTimeout = value; }
  get _duration(): number { return this._controller.durationMs; }
  set _duration(value: number) { this._controller.durationMs = value; }
  get _customDuration() { return this._controller.customDuration; }
  set _customDuration(value) { this._controller.setCustomDuration(value); }
  get _customDurationInput(): string { return this._controller.customDurationInput; }
  set _customDurationInput(value: string) { this._controller.customDurationInput = value; }
  get _showCustomInput(): boolean { return this._controller.showCustomInput; }
  set _showCustomInput(value: boolean) { this._controller.showCustomInput = value; }
  get _lastDuration() { return this._controller.lastDuration; }
  set _lastDuration(value) { this._controller.lastDuration = value; }
  get _labelRegistry() { return this._controller.labelRegistry; }
  set _labelRegistry(value) { this._controller.labelRegistry = value; }
  get _labelRegistryUnavailable(): boolean { return this._controller.labelRegistryUnavailable; }
  set _labelRegistryUnavailable(value: boolean) { this._controller.labelRegistryUnavailable = value; }
  get _entityRegistry() { return this._controller.entityRegistry; }
  set _entityRegistry(value) { this._controller.entityRegistry = value; }
  get _labelsFetched(): boolean { return this._controller.labelsFetched; }
  get _labelRegistryRetryTimeout(): number | null { return this._controller.labelRegistryRetryTimeout; }
  get _automationsCache() { return this._controller.automationsCache; }
  set _automationsCache(value) { this._controller.automationsCache = value; }
  get _automationsCacheKey() { return this._controller.automationsCacheKey; }
  set _automationsCacheKey(value) { this._controller.automationsCacheKey = value; }
  get _adjustModalResumeAt(): string { return this._viewModel.modal.resumeAt; }
  set _adjustModalResumeAt(value: string) { this._controller.setAdjustModalResumeAt(value); }
  get _disableAtDate(): string { return this._viewModel.local.disableAtDate; }
  set _disableAtDate(value: string) { this._controller.setScheduleField('disableAtDate', value); }
  get _disableAtTime(): string { return this._viewModel.local.disableAtTime; }
  set _disableAtTime(value: string) { this._controller.setScheduleField('disableAtTime', value); }
  get _resumeAtDate(): string { return this._viewModel.local.resumeAtDate; }
  set _resumeAtDate(value: string) { this._controller.setScheduleField('resumeAtDate', value); }
  get _resumeAtTime(): string { return this._viewModel.local.resumeAtTime; }
  set _resumeAtTime(value: string) { this._controller.setScheduleField('resumeAtTime', value); }

  _getAutomations() { this._controller.setHass(this.hass); return this._controller.getAutomationReadModel(); }
  _getPaused() { this._controller.setHass(this.hass); return this._controller.getPaused(); }
  _getScheduled() { this._controller.setHass(this.hass); return this._controller.getScheduled(); }
  _formatDateTime(isoString: string): string { return this._controller.formatDateTime(isoString); }
  _showToast(message: string, options: { showUndo?: boolean; onUndo?: (() => void) | null } = {}): void {
    this._controller.showToast(message, {
      showUndo: options.showUndo,
      onUndo: options.onUndo ?? undefined,
    });
    this._viewModel = this._controller.getViewModel();
    this.requestUpdate();
    this.performUpdate();
  }
  async _fetchLabelRegistry(): Promise<void> {
    this._controller.setHass(this.hass);
    await this._controller.fetchLabelRegistry();
  }

  async _fetchCategoryRegistry(): Promise<void> {
    this._controller.setHass(this.hass);
    await this._controller.fetchCategoryRegistry();
  }

  async _fetchEntityRegistry(): Promise<void> {
    this._controller.setHass(this.hass);
    await this._controller.fetchEntityRegistry();
  }

  get _categoryRegistry() { return this._controller.categoryRegistry; }
  set _categoryRegistry(value) { this._controller.categoryRegistry = value; }
  get _categoriesFetched(): boolean { return this._controller.categoriesFetched; }
  set _categoriesFetched(value: boolean) { this._controller.categoriesFetched = value; }
  get _entityRegistryFetched(): boolean { return this._controller.entityRegistryFetched; }
  set _entityRegistryFetched(value: boolean) { this._controller.entityRegistryFetched = value; }
  get _automationsCacheVersion(): number { return this._controller.automationsCacheVersion; }
  set _automationsCacheVersion(value: number) { this._controller.automationsCacheVersion = value; }
  get _guardrailConfirmOpen(): boolean { return this._controller.guardrailConfirmOpen; }
  set _guardrailConfirmOpen(value: boolean) { this._setLocalCompatibility({ guardrailConfirmOpen: value }); }
  get _recentSnoozeIds(): string[] { return this._viewModel.local.recentSnoozeIds; }
  set _recentSnoozeIds(value: string[]) { this._setLocalCompatibility({ recentSnoozeIds: value }); }
  get _notificationsEnabled(): boolean { return this._viewModel.local.notificationsEnabled; }
  set _notificationsEnabled(value: boolean) { this._controller.setNotificationsEnabled(value); }
  get _notificationTrigger() { return this._viewModel.local.notificationTrigger; }
  set _notificationTrigger(value) { this._controller.setNotificationTrigger(value); }
  get _notificationLeadMinutes(): number { return this._viewModel.local.notificationLeadMinutes; }
  set _notificationLeadMinutes(value: number) { this._controller.setNotificationLeadMinutes(value); }
  get _adjustModalOpen(): boolean { return this._viewModel.modal.open; }
  set _adjustModalOpen(value: boolean) { this._setModalCompatibility({ open: value }); }
  get _adjustModalEntityId(): string { return this._viewModel.modal.entityId; }
  set _adjustModalEntityId(value: string) { this._setModalCompatibility({ entityId: value }); }
  get _adjustModalFriendlyName(): string { return this._viewModel.modal.friendlyName; }
  set _adjustModalFriendlyName(value: string) { this._setModalCompatibility({ friendlyName: value }); }
  get _adjustModalEntityIds(): string[] { return this._viewModel.modal.entityIds; }
  set _adjustModalEntityIds(value: string[]) { this._setModalCompatibility({ entityIds: value }); }
  get _adjustModalFriendlyNames(): string[] { return this._viewModel.modal.friendlyNames; }
  set _adjustModalFriendlyNames(value: string[]) { this._setModalCompatibility({ friendlyNames: value }); }
  get _labelRegistryFetchPromise() { return this._compatController._labelRegistryFetchPromise; }
  set _labelRegistryFetchPromise(value: Promise<void> | null) { this._compatController._labelRegistryFetchPromise = value; }
  get _categoryRegistryFetchPromise() { return this._compatController._categoryRegistryFetchPromise; }
  set _categoryRegistryFetchPromise(value: Promise<void> | null) { this._compatController._categoryRegistryFetchPromise = value; }
  get _entityRegistryFetchPromise() { return this._compatController._entityRegistryFetchPromise; }
  set _entityRegistryFetchPromise(value: Promise<void> | null) { this._compatController._entityRegistryFetchPromise = value; }
  get _toastTimeout() { return this._compatController._toastTimeout; }
  get _toastFadeTimeout() { return this._compatController._toastFadeTimeout; }
  _getPausedGroupedByResumeTime() {
    this._controller.setHass(this.hass);
    return this._controller.getPausedGroupedByResumeTime();
  }
  _getLocale(): string | undefined { return this._controller.getLocale(); }
  _hasResumeAt(): boolean { return this._controller.hasResumeAt(); }
  _hasDisableAt(): boolean { return this._controller.hasDisableAt(); }
  _haveAutomationStatesChanged(oldStates: import('../types/hass.js').HassEntities, newStates: import('../types/hass.js').HassEntities): boolean {
    return this._compatController._haveAutomationStatesChanged(oldStates, newStates);
  }
  _syncAdjustModalWithPausedState(): void {
    this._compatController._syncAdjustModalWithPausedState();
    this._viewModel = this._controller.getViewModel();
  }
  async _snooze(forceConfirm = false): Promise<void> {
    this._controller.setHass(this.hass);
    await this._controller.runSnooze(forceConfirm);
    this.performUpdate();
  }
  async _cancelScheduled(entityId: string): Promise<void> {
    this._controller.setHass(this.hass);
    await this._controller.runCancelScheduled(entityId);
    this.performUpdate();
  }
  async _wake(entityId: string): Promise<void> {
    this._controller.setHass(this.hass);
    await this._controller.runWake(entityId);
    this.performUpdate();
  }

  private get _compatController(): CardControllerCompatibility {
    return this._controller as unknown as CardControllerCompatibility;
  }

  private _setModalCompatibility(update: Partial<CardControllerViewModel['modal']>): void {
    Object.assign(this._compatController._viewModel.modal, update);
    this._viewModel = this._controller.getViewModel();
    this.requestUpdate();
  }

  private _setLocalCompatibility(update: Partial<CardControllerViewModel['local']>): void {
    Object.assign(this._compatController._viewModel.local, update);
    this._viewModel = this._controller.getViewModel();
    this.requestUpdate();
  }

  getCardSize(): number {
    this._controller.setHass(this.hass);
    return this._controller.getCardSize();
  }

  _getAutomationStateFingerprint(_states: unknown): string {
    const states = _states as import('../types/hass.js').HassEntities | undefined;
    return Object.entries(states ?? {})
      .filter(([entityId]) => entityId.startsWith('automation.'))
      .map(([entityId, state]) => `${entityId}:${state.state}`)
      .sort()
      .join('|');
  }

  updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('hass')) {
      this._controller.ensureRegistriesOnHassUpdate();
    }
  }

  private _handleSelectionChange(e: CustomEvent<{ selected: string[] }>): void {
    this._controller.setSelection(e.detail.selected);
  }

  private _handleDurationChange(e: CustomEvent<{ minutes: number; duration: import('../types/automation.js').ParsedDuration; input: string; showCustomInput?: boolean }>): void {
    const { duration, input, showCustomInput } = e.detail;
    this._controller.setDurationState(duration, input, showCustomInput);
  }

  private _handleScheduleModeChange(e: CustomEvent<{ enabled: boolean }>): void {
    this._controller.setScheduleMode(e.detail.enabled);
  }

  private _handleScheduleFieldChange(e: CustomEvent<{ field: string; value: string }>): void {
    this._controller.setScheduleField(e.detail.field, e.detail.value);
  }

  private _handleCustomInputToggle(e: CustomEvent<{ show: boolean }>): void {
    this._controller.setShowCustomInput(e.detail.show);
  }

  private _handleNotificationsToggle(e: Event): void {
    this._controller.setNotificationsEnabled((e.target as HTMLInputElement).checked);
  }

  private _handleNotificationWhenChange(e: Event): void {
    this._controller.setNotificationTrigger((e.target as HTMLSelectElement).value as 'start' | 'about_to_end' | 'end');
  }

  private _handleNotificationLeadChange(e: Event): void {
    this._controller.setNotificationLeadMinutes(Number((e.target as HTMLSelectElement).value));
  }

  private _handleGuardrailCancel(): void {
    this._controller.dismissGuardrail();
  }

  private _handleGuardrailContinue(): void {
    void this._controller.runGuardrailContinue();
  }

  private _handleWakeEvent(e: CustomEvent<{ entityId: string }>): void {
    void this._wake(e.detail.entityId);
  }

  private _handleWakeAllEvent(): void {
    void this._controller.runWakeAll();
  }

  private _handleClearNotificationEvent(e: CustomEvent<{ entityId: string }>): void {
    void this._controller.runClearNotification(e.detail.entityId);
  }

  private _handleAdjustAutomationEvent(e: CustomEvent<{ entityId: string; friendlyName: string; resumeAt: string }>): void {
    this._controller.openAdjustAutomation(e.detail);
  }

  private _handleAdjustGroupEvent(e: CustomEvent<{ entityIds: string[]; friendlyNames: string[]; resumeAt: string }>): void {
    this._controller.openAdjustGroup(e.detail);
  }

  private _handleAdjustTimeEvent(e: CustomEvent<{ entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number }>): void {
    void this._controller.runAdjustTime(e.detail);
  }

  private _handleCloseModalEvent(): void {
    this._controller.closeAdjustModal();
  }

  private _handleToastUndo(): void {
    const onUndo = this._viewModel.toast?.onUndo;
    if (onUndo) {
      onUndo();
      this._controller.dismissToast();
      this._viewModel = this._controller.getViewModel();
      this.requestUpdate();
      return;
    }
    void this._controller.runToastUndo();
  }

  private _renderToast(): TemplateResult | string {
    const toast = this._viewModel.toast;
    if (!toast) {
      return '';
    }

    return html`
      <div class="toast" role="alert" aria-live="polite" aria-atomic="true">${toast.showUndo
        ? html`<span>${toast.message}</span><button
            type="button"
            class="toast-undo-btn"
            @click=${() => this._handleToastUndo()}
            aria-label=${localize(this.hass, 'a11y.undo_action')}
          >${localize(this.hass, 'button.undo')}</button>`
        : toast.message}</div>
    `;
  }

  private _renderScheduledPauses(
    scheduledCount: number,
    scheduled: Record<string, { friendly_name?: string; disable_at?: string; resume_at: string }>,
  ): TemplateResult | string {
    if (scheduledCount === 0) {
      return '';
    }

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
                  ${localize(this.hass, 'status.disables')} ${this._controller.formatDateTime(data.disable_at || 'now')}
                </div>
                <div class="paused-time">
                  ${localize(this.hass, 'status.resumes_at')} ${this._controller.formatDateTime(data.resume_at)}
                </div>
              </div>
              <button
                type="button"
                class="cancel-scheduled-btn"
                @click=${() => this._cancelScheduled(id)}
                aria-label="${localize(this.hass, 'a11y.cancel_scheduled_for', { name: data.friendly_name || id })}"
              >
                ${localize(this.hass, 'button.cancel')}
              </button>
            </div>
          `,
        )}
      </div>
    `;
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) {
      return html``;
    }

    const vm = this._viewModel;
    const { server, local, registry, derived, modal } = vm;

    return html`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title || localize(this.hass, 'card.default_title')}
          ${server.pausedCount > 0 || server.scheduledCount > 0
            ? html`<span class="status-summary"
                >${server.pausedCount > 0 ? localize(this.hass, 'status.active_count', { count: server.pausedCount }) : ''}${server.pausedCount > 0 && server.scheduledCount > 0 ? ', ' : ''}${server.scheduledCount > 0 ? localize(this.hass, 'status.scheduled_count', { count: server.scheduledCount }) : ''}</span
              >`
            : ''}
        </div>

        ${!server.sensorAvailable
          ? html`
              <div class="sensor-health-banner" role="status">
                ${localize(this.hass, 'status.sensor_unavailable')}
              </div>
            `
          : ''}

        <div class="snooze-setup">
          <autosnooze-automation-list
            .hass=${this.hass}
            .automations=${derived.automations}
            .selected=${local.selected}
            .labelRegistry=${registry.labels}
            .labelRegistryUnavailable=${registry.labelRegistryUnavailable}
            .categoryRegistry=${registry.categories}
            .recentSnoozeIds=${local.recentSnoozeIds}
            @selection-change=${this._handleSelectionChange}
          ></autosnooze-automation-list>

          <autosnooze-duration-selector
            .hass=${this.hass}
            .scheduleMode=${local.scheduleMode}
            .customDuration=${local.customDuration}
            .customDurationInput=${local.customDurationInput}
            .showCustomInput=${local.showCustomInput}
            .lastDuration=${local.lastDuration}
            .disableAtDate=${local.disableAtDate}
            .disableAtTime=${local.disableAtTime}
            .resumeAtDate=${local.resumeAtDate}
            .resumeAtTime=${local.resumeAtTime}
            @duration-change=${this._handleDurationChange}
            @schedule-mode-change=${this._handleScheduleModeChange}
            @schedule-field-change=${this._handleScheduleFieldChange}
            @custom-input-toggle=${this._handleCustomInputToggle}
          ></autosnooze-duration-selector>

          <div class="notify-section">
            <label class="notify-toggle">
              <input
                type="checkbox"
                .checked=${local.notificationsEnabled}
                @change=${this._handleNotificationsToggle}
              />
              <ha-icon icon="mdi:bell-outline" aria-hidden="true"></ha-icon>
              <span class="notify-toggle-text">
                ${localize(this.hass, 'notify.toggle_label')}
              </span>
            </label>

            ${local.notificationsEnabled ? html`
              <div class="notify-detail">
                <label class="notify-field">
                  <span class="notify-field-label visually-hidden">${localize(this.hass, 'notify.when_label')}</span>
                  <select
                    .value=${local.notificationTrigger}
                    @change=${this._handleNotificationWhenChange}
                  >
                    <option value="start">${localize(this.hass, 'notify.when.start')}</option>
                    <option value="about_to_end">${localize(this.hass, 'notify.when.about_to_end')}</option>
                    <option value="end">${localize(this.hass, 'notify.when.end')}</option>
                  </select>
                </label>

                ${local.notificationTrigger === 'about_to_end' ? html`
                  <label class="notify-field">
                    <span class="notify-field-label visually-hidden">${localize(this.hass, 'notify.lead_label')}</span>
                    <select
                      .value=${String(local.notificationLeadMinutes)}
                      @change=${this._handleNotificationLeadChange}
                    >
                      ${NOTIFICATION_LEAD_OPTIONS.map(
                        (m) => html`<option value=${String(m)}>${this._controller.formatLeadLabel(m)}</option>`,
                      )}
                    </select>
                  </label>
                ` : ''}
              </div>
            ` : ''}
          </div>

          ${local.guardrailConfirmOpen ? html`
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
            ?disabled=${local.selected.length === 0 ||
            (!local.scheduleMode && !isDurationValid(local.customDurationInput)) ||
            (local.scheduleMode && !this._controller.hasResumeAt()) ||
            local.loading}
            @click=${() => this._controller.runSnooze()}
            aria-label="${local.loading
              ? localize(this.hass, 'a11y.snoozing')
              : local.scheduleMode
                ? localize(this.hass, 'a11y.schedule_snooze', { count: local.selected.length })
                : localize(this.hass, 'a11y.snooze_count', { count: local.selected.length })}"
            aria-busy=${local.loading}
          >
            ${local.loading
              ? localize(this.hass, 'button.snoozing')
              : local.scheduleMode
                ? localize(this.hass, 'button.schedule_count', { count: local.selected.length })
                : localize(this.hass, 'button.snooze_count', { count: local.selected.length })}
          </button>
        </div>

        ${server.pausedCount > 0
          ? html`<autosnooze-active-pauses
              .hass=${this.hass}
              .pauseGroups=${server.groups}
              .pausedCount=${server.pausedCount}
              @wake-automation=${this._handleWakeEvent}
              @wake-all=${this._handleWakeAllEvent}
              @clear-notification=${this._handleClearNotificationEvent}
              @adjust-automation=${this._handleAdjustAutomationEvent}
              @adjust-group=${this._handleAdjustGroupEvent}
            ></autosnooze-active-pauses>`
          : ''}
        ${this._renderScheduledPauses(server.scheduledCount, server.scheduled)}
        <autosnooze-adjust-modal
          .hass=${this.hass}
          .open=${modal.open}
          .entityId=${modal.entityId}
          .friendlyName=${modal.friendlyName}
          .resumeAt=${modal.resumeAt}
          .entityIds=${modal.entityIds}
          .friendlyNames=${modal.friendlyNames}
          @adjust-time=${this._handleAdjustTimeEvent}
          @close-modal=${this._handleCloseModalEvent}
        ></autosnooze-adjust-modal>
        ${this._renderToast()}
      </ha-card>
    `;
  }
}

defineAutoSnoozeElement('autosnooze-card', AutomationPauseCard);
