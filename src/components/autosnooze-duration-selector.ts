/**
 * AutoSnooze Duration Selector child component.
 */

import { LitElement, html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { durationSelectorStyles } from '../styles/duration-selector.styles.js';
import { localize } from '../localization/localize.js';
import {
  formatDurationShort,
  formatDuration,
} from '../utils/time-formatting.js';
import {
  parseDurationInput,
  isDurationValid,
  durationToMinutes,
  minutesToDuration,
} from '../utils/duration-parsing.js';
import { generateDateOptions } from '../utils/datetime.js';
import { DEFAULT_DURATIONS } from '../constants/index.js';
import {
  renderScheduleModePanel,
  renderScheduleSummary,
  type ScheduleFieldDescriptor,
} from '../utils/card-shell-ui.js';
import type { ParsedDuration } from '../types/automation.js';
import type { LastDurationData } from '../services/storage.js';
import type { HomeAssistant } from '../types/hass.js';
import { SENSOR_ENTITY_ID } from '../state/paused.js';

export class AutoSnoozeDurationSelector extends LitElement {
  static styles = durationSelectorStyles;

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ type: Boolean })
  scheduleMode: boolean = false;

  @property({ attribute: false })
  customDuration: ParsedDuration = { days: 0, hours: 0, minutes: 30 };

  @property({ type: String })
  customDurationInput: string = '30m';

  @property({ type: Boolean })
  showCustomInput: boolean = false;

  @property({ attribute: false })
  lastDuration: LastDurationData | null = null;

  @property({ type: String })
  disableAtDate: string = '';

  @property({ type: String })
  disableAtTime: string = '';

  @property({ type: String })
  resumeAtDate: string = '';

  @property({ type: String })
  resumeAtTime: string = '';

  _getDurationPreview = (): string => {
    const parsed = parseDurationInput(this.customDurationInput);
    if (!parsed) return '';
    return formatDuration(parsed.days, parsed.hours, parsed.minutes);
  };

  _isDurationValid = (): boolean => isDurationValid(this.customDurationInput);

  _getDurationPills(): { label: string; minutes: number | null }[] {
    const sensor = this.hass?.states?.[SENSOR_ENTITY_ID];
    const configuredPresets = sensor?.attributes?.duration_presets as
      | { label: string; minutes: number }[]
      | undefined;
    const basePresets = configuredPresets?.length
      ? configuredPresets
      : DEFAULT_DURATIONS.filter((d): d is { label: string; minutes: number } => d.minutes !== null);

    return [
      ...basePresets,
      { label: localize(this.hass, 'duration.custom'), minutes: null },
    ];
  }

  _fireDurationChange(minutes: number, options?: { showCustomInput?: boolean }): void {
    const duration = minutesToDuration(minutes);
    const input = formatDurationShort(duration.days, duration.hours, duration.minutes) || '30m';
    this._dispatchSelectorEvent('duration-change', {
      minutes,
      duration,
      input,
      showCustomInput: options?.showCustomInput ?? false,
    });
  }

  _fireCustomDurationChange(value: string): void {
    const parsed = parseDurationInput(value);
    const totalMinutes = parsed ? durationToMinutes(parsed) : 0;
    this._dispatchSelectorEvent('duration-change', {
      minutes: totalMinutes,
      duration: parsed ?? { days: 0, hours: 0, minutes: 0 },
      input: value,
    });
  }

  _fireScheduleModeChange(enabled: boolean): void {
    this._dispatchSelectorEvent('schedule-mode-change', { enabled });
  }

  _fireScheduleFieldChange(field: string, value: string): void {
    this._dispatchSelectorEvent('schedule-field-change', { field, value });
  }

  _dispatchSelectorEvent(type: string, detail: Record<string, unknown>): void {
    this.dispatchEvent(new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true,
    }));
  }

  private _renderLastDurationBadge(): TemplateResult | string {
    if (!this.lastDuration) return '';

    const lastMinutes = this.lastDuration.minutes;
    const isUniqueFromPresets = !this._getDurationPills().some((d) => d.minutes === lastMinutes);

    if (!isUniqueFromPresets) return '';

    const { days, hours, minutes } = this.lastDuration.duration;
    const durationStr = formatDurationShort(days, hours, minutes).replace(/ /g, '');
    const currentMinutes = durationToMinutes(this.customDuration);
    const isActive = !this.showCustomInput && lastMinutes === currentMinutes;

    return html`
      <button
        type="button"
        class="last-duration-badge ${isActive ? 'active' : ''}"
        @click=${() => this._fireDurationChange(lastMinutes)}
      >
        <ha-icon icon="mdi:history" aria-hidden="true"></ha-icon>
        ${durationStr}
      </button>
    `;
  }

  render(): TemplateResult {
    const dateOptions = generateDateOptions(365, this.hass?.locale?.language).map(
      (opt) => html`<option value="${opt.value}">${opt.label}</option>`
    );

    if (this.scheduleMode) {
      const scheduleFields: ScheduleFieldDescriptor[] = [
        {
          labelId: 'snooze-at-label',
          labelKey: 'schedule.snooze_at',
          dateValue: this.disableAtDate,
          timeValue: this.disableAtTime,
          dateField: 'disableAtDate',
          timeField: 'disableAtTime',
          hintKey: 'schedule.hint_immediate',
        },
        {
          labelId: 'resume-at-label',
          labelKey: 'schedule.resume_at',
          dateValue: this.resumeAtDate,
          timeValue: this.resumeAtTime,
          dateField: 'resumeAtDate',
          timeField: 'resumeAtTime',
        },
      ];

      return renderScheduleModePanel({
        hass: this.hass,
        dateOptions,
        fields: scheduleFields,
        scheduleSummary: renderScheduleSummary(
          this.hass,
          this.resumeAtDate,
          this.resumeAtTime,
          this.disableAtDate,
          this.disableAtTime,
        ),
        onFieldChange: (field, value) => this._fireScheduleFieldChange(field, value),
        onBackToDuration: () => this._fireScheduleModeChange(false),
      });
    }

    const durationPreview = this._getDurationPreview();
    const durationValid = this._isDurationValid();

    return html`
      <div class="duration-selector">
        <div class="duration-header-row">
          <div class="duration-section-header" id="duration-header">${localize(this.hass, 'duration.header')}</div>
          ${this._renderLastDurationBadge()}
        </div>
        <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
          ${this._getDurationPills().map(
            (d) => {
              const currentMinutes = durationToMinutes(this.customDuration);
              const isActive = d.minutes === null
                ? this.showCustomInput
                : !this.showCustomInput && d.minutes === currentMinutes;
              return html`
                <button
                  type="button"
                  class="pill ${isActive ? 'active' : ''}"
                  @click=${() => {
                    if (d.minutes === null) {
                      this._dispatchSelectorEvent('custom-input-toggle', {
                        show: !this.showCustomInput,
                      });
                    } else {
                      this._fireDurationChange(d.minutes, { showCustomInput: false });
                    }
                  }}
                  role="radio"
                  aria-checked=${isActive}
                >
                  ${d.label}
                </button>
              `;
            }
          )}
        </div>

        ${this.showCustomInput ? html`
          <div class="custom-duration-input">
            <input
              type="text"
              class="duration-input ${!durationValid ? 'invalid' : ''}"
              placeholder="${localize(this.hass, 'duration.placeholder')}"
              .value=${this.customDurationInput}
              @input=${(e: Event) => this._fireCustomDurationChange((e.target as HTMLInputElement).value)}
              aria-label="${localize(this.hass, 'a11y.custom_duration')}"
              aria-invalid=${!durationValid}
              aria-describedby="duration-help"
            />
            ${durationPreview && durationValid
              ? html`<div class="duration-preview" role="status" aria-live="polite">${localize(this.hass, 'duration.preview_label')} ${durationPreview}</div>`
              : html`<div class="duration-help" id="duration-help">${localize(this.hass, 'duration.help')}</div>`}
          </div>
        ` : ''}

        <button
          type="button"
          class="schedule-link"
          @click=${() => this._fireScheduleModeChange(true)}
        >
          ${localize(this.hass, 'schedule.pick_datetime')}
        </button>
      </div>
    `;
  }
}
