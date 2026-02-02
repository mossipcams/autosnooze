/**
 * Styles for the AutoSnooze adjust modal component.
 */

import { css } from 'lit';

export const adjustModalStyles = css`
    :host {
      display: block;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    }
    .modal-content {
      background: var(--card-background-color, #fff);
      border-radius: 16px;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 12px;
      border-bottom: 1px solid var(--divider-color);
    }
    .modal-title {
      font-weight: 600;
      font-size: 1em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      margin-right: 8px;
    }
    .modal-subtitle {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 4px;
      line-height: 1.3;
      max-height: 3.9em;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .modal-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      min-height: 36px;
    }
    .modal-close:hover {
      color: var(--primary-text-color);
      background: var(--secondary-background-color);
    }
    .modal-close:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .modal-body {
      padding: 16px;
    }
    .remaining-time {
      text-align: center;
      font-size: 2em;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      padding: 12px 0 20px;
      color: var(--primary-text-color);
    }
    .remaining-label {
      text-align: center;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }
    .adjust-section {
      margin-bottom: 16px;
    }
    .adjust-section:last-child {
      margin-bottom: 0;
    }
    .adjust-section-label {
      font-size: 0.8em;
      font-weight: 500;
      color: var(--secondary-text-color);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .adjust-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .decrement-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .adjust-btn {
      padding: 10px 4px;
      border-radius: 10px;
      font-size: 0.9em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      min-height: 44px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .adjust-btn.increment {
      background: var(--card-background-color);
      color: var(--primary-color);
      border: 1.5px solid var(--primary-color);
    }
    .adjust-btn.increment:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    .adjust-btn.increment:active {
      transform: scale(0.95);
    }
    .adjust-btn.increment:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .adjust-btn.decrement {
      background: var(--card-background-color);
      color: #ff9800;
      border: 1.5px solid #ff9800;
    }
    .adjust-btn.decrement:hover:not(:disabled) {
      background: #ff9800;
      color: white;
    }
    .adjust-btn.decrement:active:not(:disabled) {
      transform: scale(0.95);
    }
    .adjust-btn.decrement:focus-visible {
      outline: 2px solid #ff9800;
      outline-offset: 2px;
    }
    .adjust-btn.decrement:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      border-color: var(--divider-color);
      color: var(--secondary-text-color);
    }
    @media (max-width: 480px) {
      .modal-content {
        max-width: 100%;
        border-radius: 20px;
      }
      .modal-header {
        padding: 18px 16px 14px;
      }
      .modal-title {
        font-size: 0.95em;
      }
      .remaining-time {
        font-size: 2.2em;
        padding: 16px 0 24px;
      }
      .adjust-btn {
        min-height: 48px;
        font-size: 0.88em;
        border-radius: 12px;
      }
      .adjust-buttons {
        gap: 10px;
      }
      .decrement-buttons {
        gap: 10px;
      }
    }
`;
