/**
 * Shared styles used across multiple AutoSnooze components.
 */

import { css } from 'lit';

export const sharedPausedStyles = css`
  .list-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    margin-bottom: 12px;
    font-size: 1em;
  }
  .list-header ha-icon {
    color: #ff9800;
  }
  .paused-info {
    flex: 1;
  }
  .paused-name {
    font-weight: 500;
  }
  .paused-time {
    font-size: 0.85em;
    color: var(--secondary-text-color);
  }
`;

export const hostBlock = css`
  :host {
    display: block;
  }
`;

export const warningSurfaceStyles = css`
  .registry-warning,
  .sensor-health-banner,
  .guardrail-confirm {
    border: 1px solid color-mix(in srgb, #ff9800 45%, var(--divider-color));
    border-radius: 8px;
    background: color-mix(in srgb, #ff9800 10%, var(--card-background-color));
    color: var(--primary-text-color);
  }
`;

export const focusVisiblePrimaryOffset2 = css`
  .tab:focus-visible,
  .search-clear-btn:focus-visible,
  .select-all-btn:focus-visible,
  .snooze-btn:focus-visible,
  .cancel-scheduled-btn:focus-visible,
  .pill:focus-visible,
  .last-duration-badge:focus-visible,
  .schedule-link:focus-visible,
  .wake-btn:focus-visible,
  .modal-close:focus-visible,
  .adjust-btn.increment:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
`;

export const focusVisiblePrimaryInset = css`
  .list-item:focus-visible,
  .group-header:focus-visible,
  .pause-group-header:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }
`;

export const focusVisibleAccentOffset2 = css`
  .wake-all:focus-visible,
  .adjust-btn.decrement:focus-visible {
    outline: 2px solid #ff9800;
    outline-offset: 2px;
  }
`;

export const focusVisibleWhiteOffset2 = css`
  .toast-undo-btn:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }
`;

export const touchTarget44 = css`
  .tab,
  .group-header,
  .pill,
  .schedule-link,
  .adjust-btn,
  .wake-btn,
  .duration-input {
    min-height: 44px;
    box-sizing: border-box;
  }
`;

export const secondaryActionButtonStyles = css`
  .cancel-scheduled-btn,
  .toast-undo-btn {
    cursor: pointer;
    transition: all 0.2s;
    min-height: 44px;
    box-sizing: border-box;
  }
`;

export const compactActionButtonStyles = css`
  .cancel-scheduled-btn,
  .wake-btn {
    padding: 6px 12px;
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.2s;
  }
`;

export const chipActivePrimary = css`
  .pill.active,
  .tab.active,
  .last-duration-badge.active {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
  }
`;

export const chipHoverPrimary = css`
  .tab:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
    opacity: 0.8;
  }
`;

export const filterTabControl = css`
  .tab {
    padding: 6px 16px;
    border-radius: 16px;
    cursor: pointer;
    font-size: 0.9em;
    background: transparent;
    border: 1px solid var(--divider-color);
    color: var(--primary-text-color);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tab-count {
    background: rgba(0, 0, 0, 0.2);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.8em;
  }
  .tab.active .tab-count {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const primaryHoverFill = css`
  .select-all-btn:hover,
  .wake-btn:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
  }
`;

export const primaryFieldFocus = css`
  .search-box input:focus,
  .duration-input:focus,
  .datetime-row select:focus,
  .datetime-row input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
  }
`;

export const mobileTouch = css`
  .tab,
  .list-item,
  .group-header,
  .pill,
  .snooze-btn,
  .cancel-scheduled-btn,
  .adjust-btn {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
`;

export const automationListMobile = css`
  @media (max-width: 480px) {
    .filter-tabs {
      gap: 2px;
      margin-bottom: 14px;
      padding: 3px;
      background: color-mix(in srgb, var(--secondary-background-color) 80%, var(--divider-color));
      border-radius: 14px;
      border-bottom: none;
    }
    .tab {
      padding: 8px 6px;
      font-size: 0.82em;
      font-weight: 500;
      border-radius: 11px;
      min-height: 40px;
      flex: 1 1 0;
      justify-content: center;
      border: none;
      background: transparent;
      transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
      gap: 4px;
    }
    .tab:hover:not(.active) {
      background: color-mix(in srgb, var(--card-background-color) 50%, transparent);
    }
    .tab.active {
      background: var(--card-background-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
      color: var(--primary-color);
      font-weight: 600;
    }
    .tab-count,
    .tab.active .tab-count {
      padding: 2px 5px;
      font-size: 0.72em;
      font-weight: 600;
      border-radius: 6px;
      min-width: 18px;
      text-align: center;
      background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    }
    .tab.active .tab-count {
      background: color-mix(in srgb, var(--primary-color) 20%, transparent);
      color: var(--primary-color);
    }
    .search-row { gap: 6px; margin-bottom: 14px; }
    .search-box input {
      padding: 9px 56px 9px 10px;
      font-size: 0.82em;
      min-height: 34px;
      border-radius: 10px;
      border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
      background: var(--card-background-color);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .search-box input::placeholder { color: var(--secondary-text-color); opacity: 0.6; }
    .search-clear-btn { right: 6px; min-height: 24px; padding: 2px 6px; border-radius: 6px; font-size: 0.72em; }
    .selection-count {
      font-weight: 500;
      color: var(--primary-text-color);
      opacity: 0.8;
      min-height: 28px;
      margin-left: 0;
      font-size: 0.72em;
      font-variant-numeric: tabular-nums;
    }
    .select-all-btn {
      padding: 0 6px;
      font-size: 0.68em;
      font-weight: 600;
      min-height: 28px;
      border-radius: 6px;
      border: 1.5px solid color-mix(in srgb, var(--primary-color) 40%, var(--divider-color));
    }
    .selection-list {
      max-height: min(200px, 35dvh);
      margin-bottom: 16px;
      border-radius: 14px;
      border: 1.5px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      background: var(--card-background-color);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
    .list-item {
      padding: 14px;
      gap: 12px;
      min-height: 52px;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .list-item:active {
      transform: scale(0.985);
      background: color-mix(in srgb, var(--primary-color) 6%, transparent);
    }
    .list-item.selected {
      background: color-mix(in srgb, var(--primary-color) 6%, transparent);
    }
    .list-item input[type="checkbox"] { width: 20px; height: 20px; border-radius: 6px; }
    .list-item-name { font-size: 0.9em; font-weight: 500; letter-spacing: -0.01em; }
    .list-item-meta { font-size: 0.72em; opacity: 0.7; margin-top: 3px; }
    .group-header {
      padding: 12px 14px;
      font-size: 0.85em;
      font-weight: 600;
      min-height: 48px;
      background: var(--secondary-background-color);
      letter-spacing: -0.01em;
    }
    .group-header:active {
      background: color-mix(in srgb, var(--secondary-background-color) 90%, var(--primary-color));
    }
    .group-badge { font-size: 0.72em; font-weight: 700; padding: 3px 8px; border-radius: 8px; }
    .list-empty { padding: 28px 20px; font-size: 0.9em; opacity: 0.6; font-style: italic; }
  }
`;

export const cardMobile = css`
  @media (max-width: 480px) {
    ha-card {
      padding: 14px;
      background: linear-gradient(
        180deg,
        var(--card-background-color) 0%,
        color-mix(in srgb, var(--card-background-color) 97%, var(--primary-color)) 100%
      );
    }
    .header {
      font-size: 1.05em;
      font-weight: 600;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      letter-spacing: -0.01em;
    }
    .header ha-icon { --mdc-icon-size: 22px; opacity: 0.9; }
    .status-summary {
      font-size: 0.7em;
      font-weight: 500;
      padding: 4px 10px;
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      border-radius: 12px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .snooze-setup { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .snooze-btn {
      padding: 16px;
      font-size: 1em;
      min-height: 56px;
      font-weight: 700;
      border-radius: 14px;
      letter-spacing: 0.01em;
      background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 85%, #000) 100%);
      box-shadow: 0 4px 14px color-mix(in srgb, var(--primary-color) 25%, transparent), 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-top: 6px;
    }
    .guardrail-confirm { border-radius: 14px; padding: 12px; }
    .guardrail-body { font-size: 0.8em; }
    .snooze-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px color-mix(in srgb, var(--primary-color) 35%, transparent), 0 3px 6px rgba(0, 0, 0, 0.12);
    }
    .snooze-btn:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 20%, transparent), 0 1px 2px rgba(0, 0, 0, 0.08);
    }
    .snooze-btn:disabled { background: var(--disabled-color, #9e9e9e); box-shadow: none; }
    .scheduled-list {
      padding: 14px;
      margin-top: 14px;
      border-radius: 16px;
      border: 2px solid #2196f3;
      background: linear-gradient(180deg, rgba(33, 150, 243, 0.06) 0%, rgba(33, 150, 243, 0.02) 100%);
      box-shadow: 0 4px 16px rgba(33, 150, 243, 0.08);
    }
    .scheduled-item {
      flex-wrap: nowrap;
      padding: 14px;
      gap: 12px;
      margin-bottom: 10px;
      align-items: center;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
    }
    .scheduled-item:last-of-type { margin-bottom: 14px; }
    .scheduled-icon { display: block; flex-shrink: 0; --mdc-icon-size: 18px; opacity: 0.8; }
    .scheduled-time { font-size: 0.72em; font-weight: 600; }
    .cancel-scheduled-btn {
      padding: 10px 14px;
      font-size: 0.82em;
      font-weight: 600;
      min-height: 40px;
      flex-shrink: 0;
      border-radius: 10px;
      border: 1.5px solid color-mix(in srgb, #f44336 60%, var(--divider-color));
      background: var(--card-background-color);
      color: #f44336;
      transition: all 0.15s ease;
    }
    .cancel-scheduled-btn:active { transform: scale(0.95); }
    .cancel-scheduled-btn:hover { background: #f44336; color: white; border-color: #f44336; }
    .toast {
      bottom: 20px;
      padding: 14px 18px;
      font-size: 0.9em;
      font-weight: 500;
      max-width: calc(100vw - 32px);
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(8px);
      background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 85%, #000) 100%);
    }
    .toast-undo-btn {
      padding: 8px 14px;
      min-height: 36px;
      font-size: 0.85em;
      font-weight: 600;
      border-radius: 8px;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      transition: all 0.15s ease;
    }
    .toast-undo-btn:hover { background: rgba(255, 255, 255, 0.25); border-color: rgba(255, 255, 255, 0.5); }
  }
`;

export const durationSelectorMobile = css`
  @media (max-width: 480px) {
    .duration-section-header { font-size: 0.8em; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.7; }
    .duration-pills { gap: 8px; margin-bottom: 12px; }
    .pill { padding: 11px 16px; font-size: 0.88em; font-weight: 500; border-radius: 24px; border: 1.5px solid color-mix(in srgb, var(--divider-color) 80%, transparent); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    .pill:active:not(.active) { transform: scale(0.95); }
    .pill:hover:not(.active) { border-color: var(--primary-color); transform: translateY(-1px); }
    .pill.active, .last-duration-badge.active { background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 85%, #000) 100%); border-color: var(--primary-color); box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 30%, transparent); transform: translateY(-1px); }
    .last-duration-badge:hover:not(.active) { border-color: var(--primary-color); transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
    .last-duration-badge.active ha-icon { color: var(--text-primary-color); }
    .last-duration-badge:active:not(.active) { transform: scale(0.95); background: color-mix(in srgb, var(--primary-color) 10%, transparent); border-color: var(--primary-color); }
    .duration-input { padding: 13px 14px; font-size: 0.9em; min-height: 46px; border-radius: 12px; border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent); box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04); }
    .duration-help { font-size: 0.72em; opacity: 0.6; margin-top: 6px; }
    .duration-preview { font-size: 0.78em; font-weight: 600; margin-top: 6px; padding: 6px 10px; background: color-mix(in srgb, var(--primary-color) 10%, transparent); border-radius: 6px; display: inline-block; }
    .schedule-link { margin-top: 14px; padding: 10px 6px; font-size: 0.85em; font-weight: 500; opacity: 0.8; }
    .schedule-link:hover { opacity: 1; }
    .schedule-inputs { padding: 14px; gap: 14px; margin-bottom: 14px; border-radius: 14px; background: linear-gradient(180deg, var(--secondary-background-color) 0%, color-mix(in srgb, var(--secondary-background-color) 95%, var(--divider-color)) 100%); border: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent); }
    .datetime-field label { font-size: 0.8em; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em; opacity: 0.7; }
    .datetime-row { flex-wrap: nowrap; gap: 8px; }
    .datetime-row select { flex: 1; min-width: 0; min-height: 46px; padding: 10px 12px; font-size: 0.9em; border-radius: 10px; border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent); }
    .datetime-row input[type="time"] { flex: 0 0 auto; width: 105px; min-height: 46px; padding: 10px; font-size: 0.9em; font-weight: 500; border-radius: 10px; border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent); }
    .field-hint { font-size: 0.7em; opacity: 0.6; font-style: italic; }
    .schedule-summary { font-size: 0.76em; border-radius: 10px; padding: 9px 10px; }
  }
`;

export const adjustModalBtnStyles = css`
  .adjust-btn {
    padding: 10px 4px;
    border-radius: 10px;
    font-size: 0.9em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--card-background-color);
  }
  .adjust-btn:active:not(:disabled) { transform: scale(0.95); }
  .adjust-btn.increment { color: var(--primary-color); border: 1.5px solid var(--primary-color); }
  .adjust-btn.increment:hover { background: var(--primary-color); color: var(--text-primary-color); }
  .adjust-btn.decrement { color: #ff9800; border: 1.5px solid #ff9800; }
  .adjust-btn.decrement:hover:not(:disabled) { background: #ff9800; color: white; }
  .adjust-btn.decrement:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: var(--divider-color);
    color: var(--secondary-text-color);
  }
`;

export const adjustModalMobile = css`
  @media (max-width: 480px) {
    .modal-content { max-width: 100%; border-radius: 20px; }
    .modal-header { padding: 18px 16px 14px; }
    .modal-title { font-size: 0.95em; }
    .remaining-time { font-size: 2.2em; padding: 16px 0 24px; }
    .adjust-btn { min-height: 48px; font-size: 0.88em; border-radius: 12px; }
    .adjust-buttons, .decrement-buttons { gap: 10px; }
  }
`;

export const activePausesMobile = css`
  @media (max-width: 480px) {
    .snooze-list { padding: 14px; margin-top: 24px; border-radius: 16px; border: 2px solid #ff9800; background: linear-gradient(180deg, rgba(255, 152, 0, 0.06) 0%, rgba(255, 152, 0, 0.02) 100%); box-shadow: 0 4px 16px rgba(255, 152, 0, 0.08); }
    .list-header { font-size: 0.95em; font-weight: 700; margin-bottom: 14px; gap: 8px; letter-spacing: -0.01em; }
    .list-header ha-icon { --mdc-icon-size: 20px; }
    .pause-group { margin-bottom: 10px; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); border: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent); }
    .pause-group-header { padding: 12px 14px; font-size: 0.85em; font-weight: 600; background: var(--secondary-background-color); }
    .pause-group-header:active { background: color-mix(in srgb, var(--secondary-background-color) 80%, transparent); }
    .pause-group-header .countdown { font-size: 1em; font-weight: 700; font-variant-numeric: tabular-nums; }
    .paused-item { padding: 12px 14px; gap: 12px; background: var(--card-background-color); }
    .paused-item:active { background: var(--secondary-background-color, rgba(0, 0, 0, 0.05)); }
    .paused-icon { --mdc-icon-size: 18px; opacity: 0.5; }
    .paused-info { flex: 1; min-width: 0; overflow: hidden; }
    .paused-name { font-size: 0.9em; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .paused-time { font-size: 0.72em; opacity: 0.6; margin-top: 2px; }
    .wake-btn { padding: 8px 14px; font-size: 0.82em; font-weight: 600; min-height: 36px; flex-shrink: 0; align-self: center; border-radius: 10px; border: 1.5px solid color-mix(in srgb, #4caf50 60%, var(--divider-color)); color: #4caf50; transition: all 0.15s ease; }
    .wake-btn:active { transform: scale(0.95); }
    .wake-btn:hover { background: #4caf50; color: white; border-color: #4caf50; }
    .wake-all { padding: 14px; font-size: 0.9em; font-weight: 600; min-height: 50px; margin-top: 12px; border-radius: 12px; border: 2px solid #ff9800; }
    .wake-all:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2); }
    .wake-all.pending { animation: pulse-orange 1.5s infinite; }
    @keyframes pulse-orange { 0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(255, 152, 0, 0); } }
  }
`;
