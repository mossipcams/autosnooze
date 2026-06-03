import { css } from 'lit';

import {
  automationListMobile,
  chipActivePrimary,
  chipHoverPrimary,
  filterTabControl,
  focusVisiblePrimaryInset,
  focusVisiblePrimaryOffset2,
  hostBlock,
  mobileTouch,
  primaryHoverFill,
  primaryFieldFocus,
  touchTarget44,
  warningSurfaceStyles,
} from './shared.styles.js';

export const automationListStyles = css`
    ${hostBlock}
    ${warningSurfaceStyles}
    ${focusVisiblePrimaryOffset2}
    ${focusVisiblePrimaryInset}
    ${touchTarget44}
    ${chipActivePrimary}
    ${chipHoverPrimary}
    ${filterTabControl}
    ${primaryHoverFill}
    ${primaryFieldFocus}
    ${mobileTouch}

    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--divider-color);
      padding-bottom: 8px;
      flex-wrap: wrap;
    }

    .search-row {
      display: flex;
      align-items: center;
      gap: 8px;
      row-gap: 8px;
      margin-bottom: 12px;
      flex-wrap: nowrap;
      min-width: 0;
      background: var(--secondary-background-color);
      padding: 8px;
      border-radius: 10px;
    }
    .search-box {
      position: relative;
      flex: 1 1 0;
      min-width: 0;
    }
    .search-box input {
      width: 100%;
      padding: 8px 72px 8px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
      font-size: 0.95em;
      min-height: 40px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .search-clear-btn {
      position: absolute;
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      padding: 4px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.8em;
      line-height: 1;
      min-height: 30px;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .search-clear-btn:hover {
      background: var(--secondary-background-color);
    }
    .registry-warning {
      margin-bottom: 10px;
      padding: 8px 10px;
      font-size: 0.82em;
    }

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
    .list-item,
    .group-header {
      display: flex;
      align-items: center;
      cursor: pointer;
      border: none;
      border-bottom: 1px solid var(--divider-color);
      width: 100%;
      text-align: left;
      font-family: inherit;
      color: inherit;
      box-sizing: border-box;
    }
    .list-item {
      gap: 10px;
      padding: 12px;
      transition: background 0.2s;
      min-height: 48px;
      background: transparent;
      font-size: inherit;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .list-item:hover {
      background: var(--secondary-background-color);
    }
    .list-item.selected {
      background: rgba(var(--rgb-primary-color), 0.1);
    }
    .list-item ha-icon {
      color: var(--primary-color);
      flex-shrink: 0;
    }
    .list-item input[type="checkbox"], .group-header input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .list-item input[type="checkbox"] {
      flex-shrink: 0;
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

    .recent-group-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 0.8em;
      font-weight: 600;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: color-mix(in srgb, var(--primary-color) 6%, transparent);
      border-bottom: 1px solid var(--divider-color);
    }
    .recent-group-header ha-icon {
      --mdc-icon-size: 14px;
      color: var(--primary-color);
      opacity: 0.85;
      flex-shrink: 0;
    }
    .list-item.is-recent:not(:hover):not(.selected) {
      background: color-mix(in srgb, var(--primary-color) 4%, transparent);
    }

    .group-header {
      gap: 8px;
      padding: 10px 12px;
      background: var(--secondary-background-color);
      font-weight: 500;
      font-size: 0.9em;
    }
    .group-header:hover {
      background: var(--divider-color);
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

    .selection-count {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      margin-left: auto;
      padding: 0;
      background: transparent;
      color: var(--secondary-text-color);
      white-space: nowrap;
      line-height: 1.2;
      font-size: 0.84em;
      font-variant-numeric: tabular-nums;
    }
    .select-all-btn {
      padding: 0 8px;
      border: 1px solid color-mix(in srgb, var(--primary-color) 50%, var(--divider-color));
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.78em;
      font-weight: 500;
      transition: all 0.2s;
      min-height: 28px;
      box-sizing: border-box;
      white-space: nowrap;
    }
    .clear-selection-btn:hover {
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      border-color: var(--divider-color);
    }
    .clear-selection-btn:active {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }

    ${automationListMobile}
`;
