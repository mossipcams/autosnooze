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
