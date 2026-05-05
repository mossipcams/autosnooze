import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function expectNamedExport(source: string, exportName: string): void {
  const declaration = `export\\s+(?:async\\s+)?(?:function|const)\\s+${exportName}\\b`;
  const namedReExport = `export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`;
  expect(source).toMatch(new RegExp(`(?:${declaration})|(?:${namedReExport})`));
}

describe('E2E visual helper contract', () => {
  test('provides Home Assistant shadow DOM and API helpers', () => {
    const source = read('e2e/helpers/ha.ts');

    [
      'CARD_ELEMENT_NAME',
      'CARD_RESOURCE_PATH',
      'EXISTING_DASHBOARD_PATH',
      'getCard',
      'loadCardResource',
      'mountCardFixture',
      'expectCardReady',
      'installCardErrorListeners',
      'assertNoCardErrors',
      'verifyCardResource',
      'setState',
      'setTheme',
      'enterEditMode',
      'openCardEditor',
      'openMoreInfo',
      'openAddCardPicker',
    ].forEach((exportName) => {
      expectNamedExport(source, exportName);
    });
  });

  test('provides layout integrity and snapshot stabilizers', () => {
    const source = read('e2e/helpers/visual.ts');

    [
      'assertNoHorizontalOverflow',
      'assertNoBrokenImages',
      'assertNoZeroSizedVisibleElements',
      'assertNoOutOfBoundsElements',
      'assertLayoutIntegrity',
      'freezeTime',
      'stabilizeForVisualSnapshot',
      'screenshotOptions',
      'volatileRegionMasks',
    ].forEach((exportName) => {
      expectNamedExport(source, exportName);
    });
  });

  test('provides visual fixture constants for variants, themes, and viewports', () => {
    const source = read('e2e/helpers/fixtures.ts');

    [
      'authenticatedVisualTest',
      'expect',
      'VISUAL_VIEWPORTS',
      'VISUAL_THEMES',
      'CARD_CONFIG_VARIANTS',
      'LAYOUT_VARIANTS',
      'GRID_SPANS',
    ].forEach((exportName) => {
      expectNamedExport(source, exportName);
    });
  });
});
