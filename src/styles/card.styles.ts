/**
 * Styles for the AutoSnooze main card.
 * Extracted from the original autosnooze-card.js
 */

import { css } from 'lit';

import {
  cardMobile,
  focusVisiblePrimaryOffset2,
  focusVisibleWhiteOffset2,
  hostBlock,
  secondaryActionButtonStyles,
  warningSurfaceStyles,
  compactActionButtonStyles,
  mobileTouch,
} from './shared.styles.js';

export const cardStyles = css`
    ${hostBlock}
    ${warningSurfaceStyles}
    ${focusVisiblePrimaryOffset2}
    ${focusVisibleWhiteOffset2}
    ${secondaryActionButtonStyles}
    ${compactActionButtonStyles}
    ${mobileTouch}
    ${cardMobile}
    ha-card {
      padding: 16px;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 1.2em;
      font-weight: 500;
    }
    .header ha-icon {
      color: var(--primary-color);
    }
    .status-summary {
      margin-left: auto;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .sensor-health-banner {
      margin-bottom: 12px;
      padding: 10px 12px;
      color: var(--primary-text-color);
      font-size: 0.85em;
    }

    /* Section A: Snooze Setup */
    .snooze-setup {
      margin-bottom: 20px;
    }

    /* Snooze Button */
    .guardrail-confirm {
      margin-top: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .guardrail-title {
      font-weight: 600;
      font-size: 0.92em;
    }
    .guardrail-body {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .guardrail-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .guardrail-cancel-btn,
    .guardrail-continue-btn {
      border-radius: 8px;
      min-height: 40px;
      padding: 8px 12px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .guardrail-continue-btn {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    .snooze-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      font-size: 1em;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
      min-height: 48px;
    }
    .snooze-btn:hover:not(:disabled) {
      opacity: 0.9;
    }
    .snooze-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Scheduled Snoozes Section */
    .scheduled-list {
      border: 2px solid #2196f3;
      border-radius: 8px;
      background: rgba(33, 150, 243, 0.05);
      padding: 12px;
      margin-top: 12px;
    }
    .scheduled-list .list-header ha-icon,
    .scheduled-icon,
    .scheduled-time {
      color: #2196f3;
    }
    .scheduled-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--card-background-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .scheduled-item:last-of-type {
      margin-bottom: 12px;
    }
    .scheduled-icon {
      opacity: 0.8;
    }
    .scheduled-time {
      font-size: 0.85em;
      font-weight: 500;
    }
    .cancel-scheduled-btn:hover {
      background: #f44336;
      color: white;
      border-color: #f44336;
    }
    /* Toast */
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      animation: slideUp 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toast-undo-btn {
      padding: 4px 12px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 4px;
      background: transparent;
      color: var(--text-primary-color);
      font-size: 0.85em;
      font-weight: 500;
    }
    .toast-undo-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.8);
    }
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }

`;
