/**
 * Styles for the AutoSnooze main card.
 * Extracted from the original autosnooze-card.js
 */

import { css } from 'lit';

export const cardStyles = css`
    :host {
      display: block;
    }
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

    /* Section A: Snooze Setup */
    .snooze-setup {
      margin-bottom: 20px;
    }

    /* Filter Tabs */
    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--divider-color);
      padding-bottom: 8px;
      flex-wrap: wrap;
    }
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
      min-height: 44px;
      box-sizing: border-box;
    }
    .tab:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      opacity: 0.8;
    }
    .tab:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .tab.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
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

    /* Search */
    .search-box {
      margin-bottom: 12px;
    }
    .search-box input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
      font-size: 0.95em;
      min-height: 44px;
    }
    .search-box input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    /* Selection List */
    .selection-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .list-empty {
      padding: 20px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }
    .list-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      cursor: pointer;
      border: none;
      border-bottom: 1px solid var(--divider-color);
      transition: background 0.2s;
      min-height: 48px;
      width: 100%;
      background: transparent;
      text-align: left;
      font-family: inherit;
      font-size: inherit;
      color: inherit;
      box-sizing: border-box;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .list-item:hover {
      background: var(--secondary-background-color);
    }
    .list-item:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }
    .list-item.selected {
      background: rgba(var(--rgb-primary-color), 0.1);
    }
    .list-item ha-icon {
      color: var(--primary-color);
      flex-shrink: 0;
    }
    .list-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
      flex-shrink: 0;
    }
    .group-header input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .list-item-content {
      flex: 1;
      min-width: 0;
    }
    .list-item-name {
      font-size: 0.95em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .list-item-meta {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .list-item-meta ha-icon {
      --mdc-icon-size: 12px;
      margin-right: 4px;
      vertical-align: middle;
    }

    /* Group Headers */
    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--secondary-background-color);
      cursor: pointer;
      font-weight: 500;
      font-size: 0.9em;
      border: none;
      border-bottom: 1px solid var(--divider-color);
      width: 100%;
      text-align: left;
      font-family: inherit;
      color: inherit;
      box-sizing: border-box;
      min-height: 44px;
    }
    .group-header:hover {
      background: var(--divider-color);
    }
    .group-header:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }
    .group-header ha-icon {
      transition: transform 0.2s;
    }
    .group-header.expanded ha-icon {
      transform: rotate(90deg);
    }
    .group-badge {
      margin-left: auto;
      padding: 2px 8px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-radius: 12px;
      font-size: 0.8em;
    }

    /* Selection Actions */
    .selection-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
      align-items: center;
      font-size: 0.9em;
    }
    .selection-actions span {
      flex: 1;
      color: var(--secondary-text-color);
    }
    .select-all-btn {
      padding: 4px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
    }
    .select-all-btn:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .select-all-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* Duration Section */
    .duration-section-header {
      font-size: 0.9em;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--secondary-text-color);
    }

    /* Duration Pills */
    .duration-selector {
      margin-bottom: 12px;
    }
    .duration-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .pill {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
      color: var(--primary-text-color);
    }
    .pill:hover {
      border-color: var(--primary-color);
    }
    .pill:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .pill.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }

    /* Duration Input */
    .custom-duration-input {
      margin-top: 8px;
    }
    .duration-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
      box-sizing: border-box;
      min-height: 44px;
    }
    .duration-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .duration-input.invalid {
      border-color: #f44336;
    }
    .duration-help {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }
    .duration-preview {
      font-size: 0.85em;
      color: var(--primary-color);
      font-weight: 500;
      margin-top: 4px;
    }

    /* Snooze Button */
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
    .snooze-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .snooze-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Section B: Active Snoozes */
    .snooze-list {
      border: 2px solid #ff9800;
      border-radius: 8px;
      background: rgba(255, 152, 0, 0.05);
      padding: 12px;
      margin-top: 20px;
    }
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

    /* Pause Group */
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
    }
    .pause-group-header ha-icon {
      --mdc-icon-size: 18px;
      color: #ff9800;
    }
    .pause-group-header .countdown {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    /* Paused Item */
    .paused-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
    }
    .paused-item + .paused-item {
      border-top: 1px solid var(--divider-color);
    }
    .paused-icon {
      color: var(--secondary-text-color);
      opacity: 0.6;
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
    .countdown {
      font-size: 0.9em;
      color: var(--primary-text-color);
      font-weight: 500;
      white-space: nowrap;
    }
    .wake-btn {
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
    }
    .wake-btn:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .wake-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* Wake All Button */
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
    .wake-all:hover {
      background: #ff9800;
      color: white;
    }
    .wake-all:focus-visible {
      outline: 2px solid #ff9800;
      outline-offset: 2px;
    }

    /* Wake All Button - Pending State */
    .wake-all.pending {
      background: #ff9800;
      color: white;
    }

    /* Empty State */
    .empty {
      padding: 20px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }

    /* Schedule Link (Progressive Disclosure) */
    .schedule-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 8px 4px;
      color: var(--primary-color);
      cursor: pointer;
      font-size: 0.9em;
      background: none;
      border: none;
      font-family: inherit;
      min-height: 44px;
      box-sizing: border-box;
    }
    .schedule-link:hover {
      text-decoration: underline;
    }
    .schedule-link:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .schedule-link ha-icon {
      --mdc-icon-size: 18px;
    }

    /* Field Hint */
    .field-hint {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }

    /* Schedule Datetime Inputs */
    .schedule-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .datetime-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .datetime-field label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      font-weight: 500;
    }
    .datetime-row {
      display: flex;
      gap: 8px;
    }
    .datetime-row select,
    .datetime-row input[type="time"] {
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
      min-height: 44px;
      box-sizing: border-box;
    }
    .datetime-row select {
      flex: 1;
      min-width: 0;
    }
    .datetime-row input[type="time"] {
      width: 110px;
      flex-shrink: 0;
    }
    .datetime-row select:focus,
    .datetime-row input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    /* Scheduled Snoozes Section */
    .scheduled-list {
      border: 2px solid #2196f3;
      border-radius: 8px;
      background: rgba(33, 150, 243, 0.05);
      padding: 12px;
      margin-top: 12px;
    }
    .scheduled-list .list-header ha-icon {
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
      color: #2196f3;
      opacity: 0.8;
    }
    .scheduled-time {
      font-size: 0.85em;
      color: #2196f3;
      font-weight: 500;
    }
    .cancel-scheduled-btn {
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
    }
    .cancel-scheduled-btn:hover {
      background: #f44336;
      color: white;
      border-color: #f44336;
    }
    .cancel-scheduled-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
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
      cursor: pointer;
      font-size: 0.85em;
      font-weight: 500;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
    }
    .toast-undo-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.8);
    }
    .toast-undo-btn:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
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

    /* Mobile Responsive Styles - Refined Utility Aesthetic */
    @media (max-width: 480px) {
      ha-card {
        padding: 14px;
        background: linear-gradient(
          180deg,
          var(--card-background-color) 0%,
          color-mix(in srgb, var(--card-background-color) 97%, var(--primary-color)) 100%
        );
      }

      /* --- Header: Compact with visual weight --- */
      .header {
        font-size: 1.05em;
        font-weight: 600;
        margin-bottom: 18px;
        padding-bottom: 12px;
        border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
        letter-spacing: -0.01em;
      }

      .header ha-icon {
        --mdc-icon-size: 22px;
        opacity: 0.9;
      }

      .status-summary {
        font-size: 0.7em;
        font-weight: 500;
        padding: 4px 10px;
        background: color-mix(in srgb, var(--primary-color) 12%, transparent);
        border-radius: 12px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      /* --- Filter Tabs: Segmented control style --- */
      .filter-tabs {
        gap: 2px;
        margin-bottom: 14px;
        padding: 3px;
        background: color-mix(in srgb, var(--secondary-background-color) 80%, var(--divider-color));
        border-radius: 14px;
        border-bottom: none;
        padding-bottom: 3px;
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
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        gap: 4px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
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

      .tab-count {
        padding: 2px 5px;
        font-size: 0.72em;
        font-weight: 600;
        background: color-mix(in srgb, var(--primary-color) 15%, transparent);
        border-radius: 6px;
        min-width: 18px;
        text-align: center;
      }

      .tab.active .tab-count {
        background: color-mix(in srgb, var(--primary-color) 20%, transparent);
        color: var(--primary-color);
      }

      /* --- Search: Refined input with subtle depth --- */
      .search-box {
        margin-bottom: 14px;
      }

      .search-box input {
        padding: 13px 14px;
        font-size: 0.9em;
        min-height: 46px;
        border-radius: 12px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
        background: var(--card-background-color);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;
      }

      .search-box input:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
      }

      .search-box input::placeholder {
        color: var(--secondary-text-color);
        opacity: 0.6;
      }

      /* --- Selection Actions: Refined toolbar --- */
      .selection-actions {
        padding: 10px 14px;
        margin-bottom: 12px;
        font-size: 0.85em;
        gap: 10px;
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--secondary-background-color) 90%, var(--primary-color)) 0%,
          var(--secondary-background-color) 100%
        );
        border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent);
      }

      .selection-actions span {
        font-weight: 500;
        color: var(--primary-text-color);
        opacity: 0.8;
      }

      .select-all-btn {
        padding: 8px 14px;
        font-size: 0.82em;
        font-weight: 600;
        min-height: 38px;
        border-radius: 8px;
        border: 1.5px solid color-mix(in srgb, var(--primary-color) 40%, var(--divider-color));
        background: var(--card-background-color);
        transition: all 0.15s ease;
      }

      .select-all-btn:hover {
        background: var(--primary-color);
        border-color: var(--primary-color);
      }

      /* --- Selection List: Card-style items with depth --- */
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
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .list-item:active {
        transform: scale(0.985);
        background: color-mix(in srgb, var(--primary-color) 6%, transparent);
      }

      .list-item:last-child {
        border-bottom: none;
      }

      .list-item.selected {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--primary-color) 8%, transparent) 0%,
          color-mix(in srgb, var(--primary-color) 4%, transparent) 100%
        );
      }

      .list-item input[type="checkbox"] {
        width: 20px;
        height: 20px;
        border-radius: 6px;
      }

      .list-item-name {
        font-size: 0.9em;
        font-weight: 500;
        letter-spacing: -0.01em;
      }

      .list-item-meta {
        font-size: 0.72em;
        opacity: 0.7;
        margin-top: 3px;
      }

      .group-header {
        padding: 12px 14px;
        font-size: 0.85em;
        font-weight: 600;
        min-height: 48px;
        background: linear-gradient(
          180deg,
          var(--secondary-background-color) 0%,
          color-mix(in srgb, var(--secondary-background-color) 90%, var(--divider-color)) 100%
        );
        letter-spacing: -0.01em;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .group-header:active {
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--secondary-background-color) 95%, var(--primary-color)) 0%,
          color-mix(in srgb, var(--secondary-background-color) 85%, var(--divider-color)) 100%
        );
      }

      .group-badge {
        font-size: 0.72em;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 8px;
      }

      /* --- Section Separator --- */
      .snooze-setup {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }

      /* --- Duration Selector: Pill-style chips --- */
      .duration-section-header {
        font-size: 0.8em;
        font-weight: 600;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        opacity: 0.7;
      }

      .duration-pills {
        gap: 8px;
        margin-bottom: 12px;
      }

      .pill {
        padding: 11px 16px;
        font-size: 0.88em;
        font-weight: 500;
        border-radius: 24px;
        min-height: 44px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 80%, transparent);
        background: var(--card-background-color);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .pill:active:not(.active) {
        transform: scale(0.95);
      }

      .pill:hover:not(.active) {
        border-color: var(--primary-color);
        transform: translateY(-1px);
      }

      .pill.active {
        background: linear-gradient(
          135deg,
          var(--primary-color) 0%,
          color-mix(in srgb, var(--primary-color) 85%, #000) 100%
        );
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 30%, transparent);
        transform: translateY(-1px);
      }

      .duration-input {
        padding: 13px 14px;
        font-size: 0.9em;
        min-height: 46px;
        border-radius: 12px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
      }

      .duration-input:focus {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
      }

      .duration-help {
        font-size: 0.72em;
        opacity: 0.6;
        margin-top: 6px;
      }

      .duration-preview {
        font-size: 0.78em;
        font-weight: 600;
        margin-top: 6px;
        padding: 6px 10px;
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        border-radius: 6px;
        display: inline-block;
      }

      .schedule-link {
        margin-top: 14px;
        padding: 10px 6px;
        font-size: 0.85em;
        font-weight: 500;
        min-height: 44px;
        opacity: 0.8;
        transition: opacity 0.15s ease;
      }

      .schedule-link:hover {
        opacity: 1;
      }

      /* --- Schedule Inputs: Refined form layout --- */
      .schedule-inputs {
        padding: 14px;
        gap: 14px;
        margin-bottom: 14px;
        border-radius: 14px;
        background: linear-gradient(
          180deg,
          var(--secondary-background-color) 0%,
          color-mix(in srgb, var(--secondary-background-color) 95%, var(--divider-color)) 100%
        );
        border: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent);
      }

      .datetime-field label {
        font-size: 0.8em;
        font-weight: 600;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        opacity: 0.7;
      }

      .datetime-row {
        flex-wrap: nowrap;
        gap: 8px;
      }

      .datetime-row select {
        flex: 1;
        min-width: 0;
        min-height: 46px;
        padding: 10px 12px;
        font-size: 0.9em;
        border-radius: 10px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
        background: var(--card-background-color);
      }

      .datetime-row input[type="time"] {
        flex: 0 0 auto;
        width: 105px;
        min-height: 46px;
        padding: 10px 10px;
        font-size: 0.9em;
        font-weight: 500;
        border-radius: 10px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
        background: var(--card-background-color);
      }

      .datetime-row select:focus,
      .datetime-row input:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
      }

      .field-hint {
        font-size: 0.7em;
        opacity: 0.6;
        font-style: italic;
      }

      /* --- Main Action Button: Prominent with depth --- */
      .snooze-btn {
        padding: 16px;
        font-size: 1em;
        min-height: 56px;
        font-weight: 700;
        border-radius: 14px;
        letter-spacing: 0.01em;
        background: linear-gradient(
          135deg,
          var(--primary-color) 0%,
          color-mix(in srgb, var(--primary-color) 85%, #000) 100%
        );
        box-shadow: 0 4px 14px color-mix(in srgb, var(--primary-color) 25%, transparent),
                    0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        margin-top: 6px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .snooze-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px color-mix(in srgb, var(--primary-color) 35%, transparent),
                    0 3px 6px rgba(0, 0, 0, 0.12);
      }

      .snooze-btn:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 20%, transparent),
                    0 1px 2px rgba(0, 0, 0, 0.08);
      }

      .snooze-btn:disabled {
        background: var(--disabled-color, #9e9e9e);
        box-shadow: none;
      }

      /* --- Active Snoozes Section: Warm accent with depth --- */
      .snooze-list {
        padding: 14px;
        margin-top: 24px;
        border-radius: 16px;
        border: 2px solid #ff9800;
        background: linear-gradient(
          180deg,
          rgba(255, 152, 0, 0.06) 0%,
          rgba(255, 152, 0, 0.02) 100%
        );
        box-shadow: 0 4px 16px rgba(255, 152, 0, 0.08);
      }

      .list-header {
        font-size: 0.95em;
        font-weight: 700;
        margin-bottom: 14px;
        gap: 8px;
        letter-spacing: -0.01em;
      }

      .list-header ha-icon {
        --mdc-icon-size: 20px;
      }

      .pause-group {
        margin-bottom: 10px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
      }

      .pause-group-header {
        padding: 12px 14px;
        font-size: 0.85em;
        font-weight: 600;
        background: var(--secondary-background-color);
      }

      .pause-group-header .countdown {
        font-size: 1em;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      /* Paused items */
      .paused-item {
        padding: 12px 14px;
        gap: 12px;
        background: var(--card-background-color);
      }

      .paused-icon {
        --mdc-icon-size: 18px;
        opacity: 0.5;
      }

      .paused-info {
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .paused-name {
        font-size: 0.9em;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .paused-time {
        font-size: 0.72em;
        opacity: 0.6;
        margin-top: 2px;
      }

      /* Wake button */
      .wake-btn {
        padding: 8px 14px;
        font-size: 0.82em;
        font-weight: 600;
        min-height: 36px;
        flex-shrink: 0;
        align-self: center;
        border-radius: 10px;
        border: 1.5px solid color-mix(in srgb, #4caf50 60%, var(--divider-color));
        background: var(--card-background-color);
        color: #4caf50;
        transition: all 0.15s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .wake-btn:active {
        transform: scale(0.95);
      }

      .wake-btn:hover {
        background: #4caf50;
        color: white;
        border-color: #4caf50;
      }

      .wake-all {
        padding: 14px;
        font-size: 0.9em;
        font-weight: 600;
        min-height: 50px;
        margin-top: 12px;
        border-radius: 12px;
        border: 2px solid #ff9800;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .wake-all:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
      }

      .wake-all.pending {
        animation: pulse-orange 1.5s infinite;
      }

      @keyframes pulse-orange {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(255, 152, 0, 0); }
      }

      /* --- Scheduled Section: Cool accent with depth --- */
      .scheduled-list {
        padding: 14px;
        margin-top: 14px;
        border-radius: 16px;
        border: 2px solid #2196f3;
        background: linear-gradient(
          180deg,
          rgba(33, 150, 243, 0.06) 0%,
          rgba(33, 150, 243, 0.02) 100%
        );
        box-shadow: 0 4px 16px rgba(33, 150, 243, 0.08);
      }

      .scheduled-list .list-header ha-icon {
        color: #2196f3;
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

      .scheduled-item:last-of-type {
        margin-bottom: 14px;
      }

      .scheduled-icon {
        display: block;
        flex-shrink: 0;
        --mdc-icon-size: 18px;
        opacity: 0.8;
      }

      .scheduled-time {
        font-size: 0.72em;
        font-weight: 600;
        color: #2196f3;
      }

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
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .cancel-scheduled-btn:active {
        transform: scale(0.95);
      }

      .cancel-scheduled-btn:hover {
        background: #f44336;
        color: white;
        border-color: #f44336;
      }

      /* --- Toast: Refined notification --- */
      .toast {
        bottom: 20px;
        padding: 14px 18px;
        font-size: 0.9em;
        font-weight: 500;
        max-width: calc(100vw - 32px);
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2),
                    0 4px 12px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(8px);
        background: linear-gradient(
          135deg,
          var(--primary-color) 0%,
          color-mix(in srgb, var(--primary-color) 85%, #000) 100%
        );
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

      .toast-undo-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.5);
      }

      /* --- Empty States: Refined messaging --- */
      .list-empty,
      .empty {
        padding: 28px 20px;
        font-size: 0.9em;
        opacity: 0.6;
        font-style: italic;
      }
    }
`;
