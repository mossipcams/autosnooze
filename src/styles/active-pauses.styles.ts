/**
 * Styles for the AutoSnooze active pauses child component.
 * Extracted from card.styles.ts for component isolation.
 */

import { css } from 'lit';

import {
  activePausesMobile,
  compactActionButtonStyles,
  focusVisibleAccentOffset2,
  focusVisiblePrimaryInset,
  focusVisiblePrimaryOffset2,
  hostBlock,
  touchTarget44,
  mobileTouch,
  primaryHoverFill,
} from './shared.styles.js';

export const activePausesStyles = css`
    ${hostBlock}
    ${focusVisiblePrimaryOffset2}
    ${focusVisiblePrimaryInset}
    ${focusVisibleAccentOffset2}
    ${touchTarget44}
    ${compactActionButtonStyles}
    ${primaryHoverFill}
    ${mobileTouch}
    .snooze-list {
      border: 2px solid #ff9800;
      border-radius: 8px;
      background: rgba(255, 152, 0, 0.05);
      padding: 12px;
      margin-top: 20px;
    }
    .pause-group {
      background: var(--card-background-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .pause-group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      color: var(--primary-text-color);
      font-size: 0.85em;
      border-bottom: 1px solid var(--divider-color);
      cursor: pointer;
    }
    .pause-group-header:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
    }
    .pause-group-header ha-icon {
      --mdc-icon-size: 18px;
      color: #ff9800;
    }
    .pause-group-header .countdown {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .paused-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      cursor: pointer;
    }
    .paused-item:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
    }
    .paused-item + .paused-item {
      border-top: 1px solid var(--divider-color);
    }
    .paused-icon {
      color: var(--secondary-text-color);
      opacity: 0.6;
    }
    .countdown {
      font-size: 0.9em;
      color: var(--primary-text-color);
      font-weight: 500;
      white-space: nowrap;
    }
    .wake-all {
      width: 100%;
      padding: 10px;
      border: 1px solid #ff9800;
      border-radius: 6px;
      background: transparent;
      color: #ff9800;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s;
      min-height: 44px;
    }
    .wake-all:hover,
    .wake-all.pending {
      background: #ff9800;
      color: white;
    }
    ${activePausesMobile}
`;
