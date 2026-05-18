import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const WORKFLOW_PATH = join(process.cwd(), '.github', 'workflows', 'release-please.yml');

function workflowSource(): string {
  return readFileSync(WORKFLOW_PATH, 'utf8');
}

function stepBlock(source: string, stepName: string): string {
  const start = source.indexOf(`- name: ${stepName}`);
  expect(start, `Missing workflow step: ${stepName}`).toBeGreaterThanOrEqual(0);

  const rest = source.slice(start + 1);
  const nextStep = rest.search(/\n\s+- name: /);
  return nextStep === -1 ? source.slice(start) : source.slice(start, start + 1 + nextStep);
}

describe('Release Please workflow', () => {
  test('artifact refresh bot pushes rely on package-level local-only Husky installs', () => {
    const source = workflowSource();
    const commitStep = stepBlock(source, 'Commit refreshed generated card artifact');
    const syncedCommitStep = stepBlock(source, 'Commit synced generated card artifact');

    expect(commitStep).not.toContain('HUSKY:');
    expect(syncedCommitStep).not.toContain('HUSKY:');
    expect(commitStep).toContain('git commit -m "build: refresh generated card artifact for release PR"');
    expect(commitStep).toContain('git push origin "HEAD:$BRANCH_NAME"');
    expect(syncedCommitStep).toContain('git commit -m "build: refresh generated card artifact for synced release PR"');
    expect(syncedCommitStep).toContain('git push origin "HEAD:$BRANCH_NAME"');
  });
});
