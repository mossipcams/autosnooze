#!/usr/bin/env bash
# Run mutmut on notify-on-resume backend code via Docker (Linux).
# Native `mutmut run` on macOS often SIGSEGVs after pytest stats because fork()
# runs from a multi-threaded process. Docker avoids that.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERNS=(
  'custom_components.autosnooze.coordinator.x__notify*'
  'custom_components.autosnooze.coordinator.x__send_resume*'
  'custom_components.autosnooze.coordinator.x__build_resume*'
  'custom_components.autosnooze.coordinator.x_async_resume*'
  'custom_components.autosnooze.coordinator.x_async_resume_batch*'
  'custom_components.autosnooze.application.pause*'
  'custom_components.autosnooze.models*'
  'custom_components.autosnooze.const*'
  'custom_components.autosnooze.runtime.restore*'
)

MAX_CHILDREN="${MAX_CHILDREN:-4}"
IMAGE="${MUTMUT_IMAGE:-python:3.14-bookworm}"

echo "Running mutmut in Docker ($IMAGE) for notify-on-resume code..."
docker run --rm \
  -v "$ROOT:/app" \
  -w /app \
  "$IMAGE" \
  bash -lc "
    set -euo pipefail
    pip install -q mutmut==3.4.0 pytest pytest-asyncio pytest-homeassistant-custom-component pytest-cov voluptuous
    pip install -q 'homeassistant>=2024.1'
    mutmut run --max-children ${MAX_CHILDREN} $(printf '%q ' \"${PATTERNS[@]}\")
  "

echo "Done. Inspect survivors: PATH=\"$ROOT/.venv/bin:\$PATH\" mutmut show <mutant-name>"
