/**
 * Card shell UI helpers (toast, scheduled sections, schedule-mode panel, update guards).
 */

import { html, type TemplateResult } from 'lit';

import { UI_TIMING } from '../constants/index.js';
import { localize } from '../localization/localize.js';
import { combineDateTime } from '../utils/datetime.js';
import type { HomeAssistant, HassEntities, PausedAutomationAttribute } from '../types/hass.js';

export interface CardToastTimers {
  toastTimeout: number | null;
  toastFadeTimeout: number | null;
}

interface AdjustModalSyncInput {
  paused: Record<string, PausedAutomationAttribute>;
  entityIds: string[];
  entityId: string;
  currentResumeAt: string;
}

export function getScheduledValidationToastKey(message: string): string {
  if (message === 'Resume time is required') return 'toast.error.invalid_datetime';
  if (message === 'Resume time must be in the future') return 'toast.error.resume_time_past';
  return 'toast.error.snooze_before_resume';
}

export function haveAutomationStatesChanged(oldStates: HassEntities, newStates: HassEntities): boolean {
  let oldAutomationCount = 0;
  for (const [entityId, oldState] of Object.entries(oldStates)) {
    if (!entityId.startsWith('automation.')) continue;
    oldAutomationCount += 1;
    if (!(entityId in newStates) || newStates[entityId] !== oldState) return true;
  }
  let newAutomationCount = 0;
  for (const entityId of Object.keys(newStates)) {
    if (entityId.startsWith('automation.')) newAutomationCount += 1;
  }
  return oldAutomationCount !== newAutomationCount;
}

export function resolveAdjustModalSync(input: AdjustModalSyncInput): {
  shouldClose: boolean;
  nextResumeAt: string | null;
} {
  const ids = input.entityIds.length > 0
    ? input.entityIds
    : (input.entityId ? [input.entityId] : []);
  if (ids.length === 0) return { shouldClose: false, nextResumeAt: null };

  const pausedId = ids.find((id) => input.paused[id]);
  if (!pausedId) return { shouldClose: true, nextResumeAt: null };

  const resumeAt = input.paused[pausedId]?.resume_at;
  return {
    shouldClose: false,
    nextResumeAt: resumeAt && resumeAt !== input.currentResumeAt ? resumeAt : null,
  };
}

export function showCardToast(
  shadowRoot: ShadowRoot | null,
  timers: CardToastTimers,
  hass: HomeAssistant | undefined,
  message: string,
  options: { showUndo?: boolean; onUndo?: (() => void) | null } = {},
): void {
  const { showUndo = false, onUndo = null } = options;
  if (!shadowRoot) return;

  shadowRoot.querySelector('.toast')?.remove();

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
    undoBtn.textContent = localize(hass, 'button.undo');
    undoBtn.setAttribute('aria-label', localize(hass, 'a11y.undo_action'));
    undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onUndo();
      toast.remove();
    });
    toast.appendChild(undoBtn);
  } else {
    toast.textContent = message;
  }

  shadowRoot.appendChild(toast);
  if (timers.toastTimeout !== null) clearTimeout(timers.toastTimeout);
  if (timers.toastFadeTimeout !== null) clearTimeout(timers.toastFadeTimeout);

  timers.toastTimeout = window.setTimeout(() => {
    timers.toastTimeout = null;
    if (!shadowRoot || !toast.parentNode) return;
    toast.style.animation = `slideUp ${UI_TIMING.TOAST_FADE_MS}ms ease-out reverse`;
    timers.toastFadeTimeout = window.setTimeout(() => {
      timers.toastFadeTimeout = null;
      toast.remove();
    }, UI_TIMING.TOAST_FADE_MS);
  }, UI_TIMING.TOAST_DURATION_MS);
}

export function renderScheduledPausesSection(
  hass: HomeAssistant | undefined,
  scheduledCount: number,
  scheduled: Record<string, { friendly_name?: string; disable_at?: string; resume_at: string }>,
  formatDateTime: (isoString: string) => string,
  onCancel: (entityId: string) => void,
): TemplateResult | string {
  if (scheduledCount === 0) return '';

  return html`
    <div class="scheduled-list" role="region" aria-label="${localize(hass, 'a11y.scheduled_region')}">
      <div class="list-header">
        <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
        ${localize(hass, 'section.scheduled_count', { count: scheduledCount })}
      </div>
      ${Object.entries(scheduled).map(([id, data]) => html`
        <div class="scheduled-item" role="article" aria-label="${localize(hass, 'a11y.scheduled_pause_for', { name: data.friendly_name || id })}">
          <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
          <div class="paused-info">
            <div class="paused-name">${data.friendly_name || id}</div>
            <div class="scheduled-time">${localize(hass, 'status.disables')} ${formatDateTime(data.disable_at || 'now')}</div>
            <div class="paused-time">${localize(hass, 'status.resumes_at')} ${formatDateTime(data.resume_at)}</div>
          </div>
          <button type="button" class="cancel-scheduled-btn" @click=${() => onCancel(id)} aria-label="${localize(hass, 'a11y.cancel_scheduled_for', { name: data.friendly_name || id })}">
            ${localize(hass, 'button.cancel')}
          </button>
        </div>
      `)}
    </div>
  `;
}

function formatScheduleDateTime(hass: HomeAssistant | undefined, isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleString(hass?.locale?.language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function renderScheduleSummary(
  hass: HomeAssistant | undefined,
  resumeAtDate: string,
  resumeAtTime: string,
  disableAtDate: string,
  disableAtTime: string,
): TemplateResult | string {
  const resumeAt = resumeAtDate && resumeAtTime ? combineDateTime(resumeAtDate, resumeAtTime) : null;
  const disableAt = disableAtDate && disableAtTime ? combineDateTime(disableAtDate, disableAtTime) : null;
  if (!resumeAt) return '';
  if (!disableAt) {
    return html`<div class="schedule-summary" role="status" aria-live="polite">${localize(hass, 'schedule.summary_immediate', { resume: formatScheduleDateTime(hass, resumeAt) })}</div>`;
  }
  if (new Date(disableAt).getTime() >= new Date(resumeAt).getTime()) {
    return html`<div class="schedule-summary invalid" role="status" aria-live="polite">${localize(hass, 'schedule.summary_invalid_order')}</div>`;
  }
  return html`<div class="schedule-summary" role="status" aria-live="polite">${localize(hass, 'schedule.summary_with_disable', { disable: formatScheduleDateTime(hass, disableAt), resume: formatScheduleDateTime(hass, resumeAt) })}</div>`;
}

export interface ScheduleFieldDescriptor {
  labelId: string;
  labelKey: string;
  dateValue: string;
  timeValue: string;
  dateField: string;
  timeField: string;
  hintKey?: string;
}

export function renderScheduleModePanel(input: {
  hass: HomeAssistant | undefined;
  dateOptions: TemplateResult[];
  fields: ScheduleFieldDescriptor[];
  scheduleSummary: TemplateResult | string;
  onFieldChange: (field: string, value: string) => void;
  onBackToDuration: () => void;
}): TemplateResult {
  return html`
    <div class="schedule-inputs">
      ${input.fields.map((field) => html`
        <div class="datetime-field">
          <label id=${field.labelId}>${localize(input.hass, field.labelKey)}</label>
          <div class="datetime-row">
            <select .value=${field.dateValue} @change=${(e: Event) => input.onFieldChange(field.dateField, (e.target as HTMLSelectElement).value)} aria-labelledby=${field.labelId}>
              <option value="">${localize(input.hass, 'schedule.select_date')}</option>
              ${input.dateOptions}
            </select>
            <input type="time" .value=${field.timeValue} @input=${(e: Event) => input.onFieldChange(field.timeField, (e.target as HTMLInputElement).value)} aria-labelledby=${field.labelId} />
          </div>
          ${field.hintKey ? html`<span class="field-hint">${localize(input.hass, field.hintKey)}</span>` : ''}
        </div>
      `)}
      ${input.scheduleSummary}
      <button type="button" class="schedule-link" @click=${input.onBackToDuration}>
        <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
        ${localize(input.hass, 'schedule.back_to_duration')}
      </button>
    </div>
  `;
}
