import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractBundleCardVersion } from '../utils/version-sync.js';

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
