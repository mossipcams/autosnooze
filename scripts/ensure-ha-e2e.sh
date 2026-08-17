#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/.." && pwd))"

HA_URL="${HA_URL:-http://localhost:8124}"
LOG=/tmp/autosnooze-hass-e2e.log
OVERLAY=/tmp/autosnooze-e2e-ha-config

ha_responds() {
  curl -sf --connect-timeout 1 "$HA_URL" >/dev/null 2>&1
}

if ha_responds; then
  exit 0
fi

# Sleep-loop devcontainers publish 8124 without running hass. Starting them
# occupies the port with connection-reset; attaching into them wedges OrbStack.
# docker stop with a client-side timeout so a wedged engine cannot hang git push
release_stale_docker_port() {
  command -v docker >/dev/null 2>&1 || return 0
  command -v python3 >/dev/null 2>&1 || return 0
  HA_URL="$HA_URL" python3 - <<'PY'
import os, subprocess, urllib.parse
port = urllib.parse.urlparse(os.environ["HA_URL"]).port or 8124
needle = str(port)
try:
    out = subprocess.run(
        ["docker", "ps", "--format", "{{.ID}} {{.Ports}}"],
        capture_output=True, text=True, timeout=5,
    )
except Exception:
    raise SystemExit(0)
for line in out.stdout.splitlines():
    if needle not in line:
        continue
    cid = line.split()[0]
    try:
        subprocess.run(
            ["docker", "stop", "-t", "2", cid],
            timeout=8,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass
    break
PY
}

resolve_hass() {
  if [ -x "$ROOT/.venv/bin/hass" ]; then
    echo "$ROOT/.venv/bin/hass"
    return 0
  fi
  if command -v hass >/dev/null 2>&1; then
    echo hass
    return 0
  fi
  return 1
}

resolve_config_dir() {
  if [ -d "$ROOT/config" ]; then
    echo "$ROOT/config"
    return 0
  fi

  while IFS= read -r worktree_path; do
    if [ -n "$worktree_path" ] && [ -d "$worktree_path/config" ]; then
      echo "$worktree_path/config"
      return 0
    fi
  done <<EOF
$(git -C "$ROOT" worktree list --porcelain 2>/dev/null | awk '/^worktree / {print $2}')
EOF

  if [ -n "${HA_CONFIG:-}" ] && [ -d "$HA_CONFIG" ]; then
    echo "$HA_CONFIG"
    return 0
  fi

  return 1
}

make_overlay() {
  src="$1"
  mkdir -p "$OVERLAY/custom_components" "$OVERLAY/themes"
  for f in configuration.yaml automations.yaml scripts.yaml scenes.yaml secrets.yaml .storage .HA_VERSION blueprints www tts home-assistant_v2.db; do
    if [ -e "$src/$f" ]; then
      ln -sfn "$src/$f" "$OVERLAY/$f"
    fi
  done
  ln -sfn "$ROOT/custom_components/autosnooze" "$OVERLAY/custom_components/autosnooze"
  echo "$OVERLAY"
}

start_hass() {
  hass_bin="$(resolve_hass)" || return 1
  config_dir="$(resolve_config_dir)" || return 1

  if [ -L "$config_dir/custom_components/autosnooze" ] && [ ! -e "$config_dir/custom_components/autosnooze" ]; then
    config_dir="$(make_overlay "$config_dir")"
  fi

  nohup "$hass_bin" -c "$config_dir" >>"$LOG" 2>&1 </dev/null &
}

release_stale_docker_port

if ! start_hass; then
  echo "ensure-ha-e2e: Home Assistant is not reachable at $HA_URL and could not be started." >&2
  echo "ensure-ha-e2e: Need $ROOT/.venv/bin/hass (or hass on PATH) and a config directory." >&2
  echo "ensure-ha-e2e: Create $ROOT/config, use another git worktree's config/, or set HA_CONFIG." >&2
  exit 1
fi

deadline=45
attempt=0
while ! ha_responds; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$deadline" ]; then
    echo "ensure-ha-e2e: timed out after 90s waiting for $HA_URL" >&2
    echo "ensure-ha-e2e: If Docker is holding the port without serving HA, restart OrbStack and retry." >&2
    exit 1
  fi
  sleep 2
done
