import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface CardVersionSnapshot {
  packageVersion: string;
  manifestVersion: string;
  bundleVersion: string;
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PACKAGE_JSON_PATH = resolve(REPO_ROOT, 'package.json');
const MANIFEST_JSON_PATH = resolve(REPO_ROOT, 'custom_components/autosnooze/manifest.json');
const BUNDLE_PATH = resolve(REPO_ROOT, 'custom_components/autosnooze/www/autosnooze-card.js');

function parseVersionField(jsonText: string, sourceName: string): string {
  const parsed = JSON.parse(jsonText) as { version?: unknown };
  if (typeof parsed.version !== 'string' || parsed.version.length === 0) {
    throw new Error(`${sourceName} is missing a string "version" field.`);
  }

  return parsed.version;
}

export function extractBundleCardVersion(bundleText: string): string {
  const markerIndex = bundleText.indexOf('name:"AutoSnooze Card"');
  if (markerIndex === -1) {
    throw new Error('Could not locate AutoSnooze card metadata in the built bundle.');
  }

  const precedingSource = bundleText.slice(0, markerIndex);
  const matches = [...precedingSource.matchAll(/function\s+\w+\(e="([^"]+)"\)/g)];
  const version = matches.length > 0 ? matches[matches.length - 1]?.[1] : undefined;

  if (!version) {
    throw new Error('Could not extract the default registration version from the built bundle.');
  }

  return version;
}

export function readCardVersionSnapshot(): CardVersionSnapshot {
  return {
    packageVersion: parseVersionField(readFileSync(PACKAGE_JSON_PATH, 'utf8'), 'package.json'),
    manifestVersion: parseVersionField(
      readFileSync(MANIFEST_JSON_PATH, 'utf8'),
      'custom_components/autosnooze/manifest.json'
    ),
    bundleVersion: extractBundleCardVersion(readFileSync(BUNDLE_PATH, 'utf8')),
  };
}

export function assertCardVersionSync(snapshot: CardVersionSnapshot): void {
  if (snapshot.packageVersion !== snapshot.manifestVersion) {
    throw new Error(
      `manifest version "${snapshot.manifestVersion}" does not match package version "${snapshot.packageVersion}".`
    );
  }

  if (snapshot.bundleVersion !== snapshot.packageVersion) {
    throw new Error(
      `bundle version "${snapshot.bundleVersion}" does not match package version "${snapshot.packageVersion}".`
    );
  }
}
