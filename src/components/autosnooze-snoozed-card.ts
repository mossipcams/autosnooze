/**
 * AutoSnooze Snoozed-Only Card Component.
 * A thin Lovelace card that surfaces only currently snoozed automations and
 * their resume/adjust actions. Reuses AutoSnoozeActivePauses for rendering and
 * delegates service orchestration to the shared actions controller, so it never
 * duplicates the main card's setup UI (picker, duration, scheduled snoozes).
 */

import { LitElement, html, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant } from '../types/hass.js';
import type { AutoSnoozeCardConfig, HapticFeedbackType } from '../types/card.js';
import { cardStyles } from '../styles/card.styles.js';
import { sharedPausedStyles } from '../styles/shared.styles.js';
import { hapticFeedback } from '../utils/haptic.js';
import { defineAutoSnoozeElement } from '../utils/custom-element-registration.js';
import {
  runAdjustAction,
  runWakeAction,
  runWakeAllAction,
} from './autosnooze-actions-controller.js';
import {
  createAdjustModalState,
  createClosedAdjustModalState,
  getCardPausedSnapshot,
  isCardSnoozeSensorAvailable,
  SNOOZE_SENSOR_ENTITY_ID,
} from '../features/card-shell/index.js';

type AdjustModalState = ReturnType<typeof createClosedAdjustModalState>;

export class AutoSnoozeSnoozedCard extends LitElement {
  static styles = [sharedPausedStyles, cardStyles];

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  config: AutoSnoozeCardConfig = {} as AutoSnoozeCardConfig;

  @state() private _adjustModal: AdjustModalState = createClosedAdjustModalState();

  static getConfigElement(): HTMLElement {
    return document.createElement('autosnooze-card-editor');
  }

  static getStubConfig(): AutoSnoozeCardConfig {
    return { type: 'custom:autosnooze-snoozed-card', title: 'Snoozed Automations' };
  }

  setConfig(config: AutoSnoozeCardConfig): void {
    this.config = config;
  }

  getCardSize(): number {
    const snapshot = this.hass ? getCardPausedSnapshot(this.hass) : null;
    return 1 + (snapshot ? Object.keys(snapshot.paused).length : 0);
  }

  shouldUpdate(changedProps: PropertyValues): boolean {
    const previous = changedProps.get('hass') as HomeAssistant | undefined;
    if (!previous || !this.hass) {
      return true;
    }
    const sensorChanged =
      previous.states?.[SNOOZE_SENSOR_ENTITY_ID] !== this.hass.states?.[SNOOZE_SENSOR_ENTITY_ID];
    const languageChanged =
      (previous.language ?? previous.locale?.language) !==
      (this.hass.language ?? this.hass.locale?.language);
    return sensorChanged || languageChanged;
  }

  updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('hass') && this._adjustModal.adjustModalOpen) {
      this._syncAdjustModalWithPaused();
    }
  }

  private _hapticFeedback(type: HapticFeedbackType = 'light'): void {
    hapticFeedback(type);
  }

  /**
   * Close (or resync) the adjust modal as the underlying paused state changes,
   * so a resumed automation can't leave a stale modal open.
   */
  private _syncAdjustModalWithPaused(): void {
    if (!this.hass) return;
    const paused = getCardPausedSnapshot(this.hass).paused;
    const modal = this._adjustModal;
    const targets =
      modal.adjustModalEntityIds.length > 0
        ? modal.adjustModalEntityIds
        : [modal.adjustModalEntityId].filter(Boolean);

    const firstStillPaused = targets.find((id) => paused[id]);
    if (!firstStillPaused) {
      this._handleCloseModalEvent();
      return;
    }

    const nextResumeAt = paused[firstStillPaused]?.resume_at;
    if (nextResumeAt && nextResumeAt !== modal.adjustModalResumeAt) {
      this._adjustModal = { ...modal, adjustModalResumeAt: nextResumeAt };
    }
  }

  private async _handleWakeEvent(e: CustomEvent<{ entityId: string }>): Promise<void> {
    if (!this.hass) return;
    try {
      await runWakeAction(this.hass, e.detail.entityId);
      this._hapticFeedback('success');
    } catch (err) {
      console.error('Wake failed:', err);
      this._hapticFeedback('failure');
    }
  }

  private async _handleWakeAllEvent(): Promise<void> {
    if (!this.hass) return;
    try {
      await runWakeAllAction(this.hass);
      this._hapticFeedback('success');
    } catch (err) {
      console.error('Wake all failed:', err);
      this._hapticFeedback('failure');
    }
  }

  private _handleAdjustAutomationEvent(
    e: CustomEvent<{ entityId: string; friendlyName: string; resumeAt: string }>
  ): void {
    this._adjustModal = createAdjustModalState({
      entityId: e.detail.entityId,
      friendlyName: e.detail.friendlyName,
      resumeAt: e.detail.resumeAt,
    });
  }

  private _handleAdjustGroupEvent(
    e: CustomEvent<{ entityIds: string[]; friendlyNames: string[]; resumeAt: string }>
  ): void {
    this._adjustModal = createAdjustModalState({
      entityIds: e.detail.entityIds,
      friendlyNames: e.detail.friendlyNames,
      resumeAt: e.detail.resumeAt,
    });
  }

  private async _handleAdjustTimeEvent(
    e: CustomEvent<{ entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number }>
  ): Promise<void> {
    if (!this.hass) return;
    const { entityId, entityIds, ...params } = e.detail;
    const target = entityIds && entityIds.length > 0 ? entityIds : entityId;
    if (!target) return;
    try {
      await runAdjustAction(this.hass, target, params);
      this._hapticFeedback('success');
    } catch (err) {
      console.error('Adjust failed:', err);
      this._hapticFeedback('failure');
    }
  }

  private _handleCloseModalEvent(): void {
    this._adjustModal = createClosedAdjustModalState();
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) {
      return html``;
    }

    const snapshot = getCardPausedSnapshot(this.hass);
    const pausedCount = Object.keys(snapshot.paused).length;
    const modal = this._adjustModal;

    return html`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:bell-sleep"></ha-icon>
          ${this.config?.title || localize(this.hass, 'card.snoozed_title')}
          ${pausedCount > 0
            ? html`<span class="status-summary"
                >${localize(this.hass, 'status.active_count', { count: pausedCount })}</span
              >`
            : ''}
        </div>

        ${!isCardSnoozeSensorAvailable(this.hass)
          ? html`
              <div class="sensor-health-banner" role="status">
                ${localize(this.hass, 'status.sensor_unavailable')}
              </div>
            `
          : ''}

        ${pausedCount > 0
          ? html`<autosnooze-active-pauses
              .hass=${this.hass}
              .pauseGroups=${snapshot.groups}
              .pausedCount=${pausedCount}
              @wake-automation=${this._handleWakeEvent}
              @wake-all=${this._handleWakeAllEvent}
              @adjust-automation=${this._handleAdjustAutomationEvent}
              @adjust-group=${this._handleAdjustGroupEvent}
            ></autosnooze-active-pauses>`
          : html`<div class="snoozed-empty" role="status">
              ${localize(this.hass, 'status.no_snoozed')}
            </div>`}

        <autosnooze-adjust-modal
          .hass=${this.hass}
          .open=${modal.adjustModalOpen}
          .entityId=${modal.adjustModalEntityId}
          .friendlyName=${modal.adjustModalFriendlyName}
          .resumeAt=${modal.adjustModalResumeAt}
          .entityIds=${modal.adjustModalEntityIds}
          .friendlyNames=${modal.adjustModalFriendlyNames}
          @adjust-time=${this._handleAdjustTimeEvent}
          @close-modal=${this._handleCloseModalEvent}
        ></autosnooze-adjust-modal>
      </ha-card>
    `;
  }
}

defineAutoSnoozeElement('autosnooze-snoozed-card', AutoSnoozeSnoozedCard);
