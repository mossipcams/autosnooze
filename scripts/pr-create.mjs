import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const HA_READY_TIMEOUT_MS = 5000;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function isHomeAssistantAvailable(haUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HA_READY_TIMEOUT_MS);

  try {
    const response = await fetch(haUrl, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function confirmSkipE2e(haUrl) {
  if (!process.stdin.isTTY) {
    console.error(`Home Assistant appears down at ${haUrl}. Refusing to skip E2E without interactive approval.`);
    return false;
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await readline.question(
      `Home Assistant appears down at ${haUrl}. Skip E2E and continue creating PR? [y/N] `,
    );
    return /^(y|yes)$/i.test(answer.trim());
  } finally {
    readline.close();
  }
}

async function main() {
  run('bash', ['.husky/pre-commit']);

  const haUrl = process.env.HA_URL || 'http://localhost:8124';
  const isHaReady = await isHomeAssistantAvailable(haUrl);
  if (!isHaReady && !(await confirmSkipE2e(haUrl))) {
    process.exit(1);
  }

  const e2eCommand = 'npm run e2e';
  const [e2eExecutable, ...e2eArgs] = e2eCommand.split(' ');
  if (isHaReady) {
    run(e2eExecutable, e2eArgs);
  }

  const prCreateCommand = 'gh pr create';
  const [command, ...args] = prCreateCommand.split(' ');
  run(command, [...args, ...process.argv.slice(2)]);
}

await main();
