import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

const REPO_ROOT = join(__dirname, '..');
const GOLDEN_PATH = join(REPO_ROOT, 'docs', 'telemetry-payloads.json');
const CAPTURE_SCRIPT = join(REPO_ROOT, 'tests', 'helpers', 'telemetry_privacy_capture.py');

const CANARY_STRINGS = [
  'automation.guest_private_bedroom',
  "Guest's Private Bedroom",
  'guest@example.com',
  'https://private-home.example.com',
  '192.168.1.45',
  'private-user-id-12345',
  'private-config-entry-67890',
] as const;

const FORBIDDEN_PAYLOAD_FIELDS = [
  'entity_id',
  'friendly_name',
  'user_id',
  'config_entry_id',
  'area_id',
  'device_id',
  'latitude',
  'longitude',
  'install_id',
  'clientUser',
] as const;

type CaptureMeta = {
  autosnooze_version: string;
  canary_hits: string[];
  events_exercised: number;
  forbidden_field_names: string[];
  forbidden_ha_fields: number;
  outbound_requests: number;
  telemetry_requests_while_disabled: number;
  undocumented_field_names: string[];
  undocumented_fields: number;
};

type CaptureResult = {
  meta: CaptureMeta;
  payloads: Record<string, Record<string, string>>;
};

function resolvePython(): string {
  const venvPython = join(REPO_ROOT, '.venv', 'bin', 'python');
  return existsSync(venvPython) ? venvPython : 'python3';
}

function runCapture(): CaptureResult {
  const stdout = execFileSync(resolvePython(), [CAPTURE_SCRIPT], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(stdout) as CaptureResult;
}

function shortCommitSha(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

function buildReport(meta: CaptureMeta): string {
  const passed =
    meta.events_exercised === 14 &&
    meta.outbound_requests === 14 &&
    meta.undocumented_fields === 0 &&
    meta.forbidden_ha_fields === 0 &&
    meta.telemetry_requests_while_disabled === 0 &&
    meta.canary_hits.length === 0;

  return [
    'AutoSnooze Telemetry Privacy Verification',
    `Commit: ${shortCommitSha()}`,
    `AutoSnooze version: ${meta.autosnooze_version}`,
    'Telemetry events exercised: 14/14',
    `Outbound requests captured: ${meta.outbound_requests}`,
    `Undocumented fields found: ${meta.undocumented_fields}`,
    `Private canary values found: ${meta.canary_hits.length}`,
    `Forbidden Home Assistant fields found: ${meta.forbidden_ha_fields}`,
    `Telemetry requests while disabled: ${meta.telemetry_requests_while_disabled}`,
    `RESULT: ${passed ? 'PASSED' : 'FAILED'}`,
    '',
  ].join('\n');
}

function publishReport(report: string): void {
  process.stdout.write(`${report}\n`);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    appendFileSync(summaryPath, `${report}\n`);
  }
}

describe('telemetry privacy verification', () => {
  const capture = runCapture();
  const documented = JSON.parse(readFileSync(GOLDEN_PATH, 'utf8')) as Record<
    string,
    Record<string, string>
  >;

  test('exercises all telemetry events and matches documented payloads', () => {
    expect(capture.meta.events_exercised).toBe(14);
    expect(capture.meta.outbound_requests).toBe(14);
    expect(capture.meta.telemetry_requests_while_disabled).toBe(0);
    expect(capture.meta.undocumented_fields).toBe(0);
    expect(capture.meta.forbidden_ha_fields).toBe(0);
    expect(capture.meta.canary_hits).toEqual([]);

    expect(Object.keys(capture.payloads).sort()).toEqual(Object.keys(documented).sort());

    for (const [event, actualPayload] of Object.entries(capture.payloads)) {
      const documentedPayload = documented[event];
      expect(actualPayload).toEqual(documentedPayload);
      const serialized = JSON.stringify(actualPayload);
      expect(serialized).not.toContain('guest_private_bedroom');
      for (const canary of CANARY_STRINGS) {
        expect(serialized).not.toContain(canary);
      }
      for (const forbiddenField of FORBIDDEN_PAYLOAD_FIELDS) {
        expect(actualPayload).not.toHaveProperty(forbiddenField);
      }
    }

    const report = buildReport(capture.meta);
    publishReport(report);
    expect(report).toContain('RESULT: PASSED');
  });
});
