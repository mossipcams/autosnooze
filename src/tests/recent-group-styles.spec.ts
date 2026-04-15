import { describe, expect, test } from 'vitest';
import { automationListStyles } from '../styles/automation-list.styles.js';

describe('Recent group header styles', () => {
  test('.recent-group-header has styles defined', () => {
    const cssText = automationListStyles.cssText;
    expect(cssText).toContain('.recent-group-header');
  });
});
