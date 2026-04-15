import { describe, expect, test } from 'vitest';

import {
  assertCardVersionSync,
  extractBundleCardVersion,
  readCardVersionSnapshot,
} from './version-sync.js';

describe('Card version sync', () => {
  test('extracts the default registration version from the built bundle', () => {
    const bundle = [
      'function Xt(e="1.2.3"){',
      'const t=function(e){return{type:Kt,name:"AutoSnooze Card",',
      'description:`Temporarily pause automations with area and label filtering (v${e})`,',
      'preview:!0}}(e)}',
    ].join('');

    expect(extractBundleCardVersion(bundle)).toBe('1.2.3');
  });

  test('throws when the built bundle version drifts from source metadata', () => {
    expect(() =>
      assertCardVersionSync({
        packageVersion: '0.2.18',
        manifestVersion: '0.2.18',
        bundleVersion: '0.2.17',
      })
    ).toThrowError(/bundle version "0\.2\.17" does not match package version "0\.2\.18"/);
  });

  test('accepts the current repository snapshot when versions are aligned', () => {
    const snapshot = readCardVersionSnapshot();

    expect(snapshot.packageVersion).toBe(snapshot.manifestVersion);
    expect(() => assertCardVersionSync(snapshot)).not.toThrow();
  });
});
