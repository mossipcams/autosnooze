interface CardVersionSnapshot {
  packageVersion: string;
  manifestVersion: string;
  bundleVersion: string;
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
