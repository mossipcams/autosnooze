import { describe, expect, test } from 'vitest';
import { automationListStyles } from '../styles/automation-list.styles.js';
import { cardStyles } from '../styles/card.styles.js';
import { durationSelectorStyles } from '../styles/duration-selector.styles.js';

function cssBlock(cssText: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = Array.from(cssText.matchAll(new RegExp(`${escapedSelector}\\s*\\{[^}]*\\}`, 'g')));
  expect(matches, `Missing CSS block for ${selector}`).not.toHaveLength(0);
  return matches[matches.length - 1][0];
}

function declarationValue(block: string, property: string): string {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(new RegExp(`${escapedProperty}:\\s*([^;]+);`));
  expect(match, `Missing ${property} declaration in ${block}`).not.toBeNull();
  return match![1].trim();
}

describe('Mobile layout compactness', () => {
  test('duration controls leave less vertical space before the snooze button on mobile', () => {
    const cssText = durationSelectorStyles.cssText;

    expect(cssText).toContain('@media (max-width: 480px)');
    expect(declarationValue(cssBlock(cssText, '.duration-pills'), 'margin-bottom')).toBe('6px');
    expect(declarationValue(cssBlock(cssText, '.schedule-link'), 'margin-top')).toBe('6px');
    expect(declarationValue(cssBlock(cssText, '.schedule-link'), 'padding')).toBe('6px 4px');
    expect(declarationValue(cssBlock(cssText, '.schedule-link'), 'min-height')).toBe('36px');
  });

  test('mobile snooze button does not add extra top spacing', () => {
    const cssText = cardStyles.cssText;

    expect(cssText).toContain('@media (max-width: 480px)');
    expect(declarationValue(cssBlock(cssText, '.snooze-btn'), 'margin-top')).toBe('0');
  });

  test('mobile automation list keeps adaptive sizing with one extra row', () => {
    const cssText = automationListStyles.cssText;

    expect(cssText).not.toContain('@media (max-width: 480px) and (orientation: portrait)');
    expect(declarationValue(cssBlock(cssText, '.selection-list'), 'max-height')).toBe('min(252px, calc(35dvh + 52px))');
    expect(cssText).toContain('-webkit-overflow-scrolling: touch');
    expect(cssText).toContain('overscroll-behavior: contain');
  });
});
