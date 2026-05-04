"""Temporary PR #329 frontend boundary regression tests."""

from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess
from typing import Any


ROOT = Path(__file__).parent.parent


def _read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def _imports_for(path: str) -> list[str]:
    source = _read(path)
    return re.findall(r"""^import\s.+?\sfrom\s+['"](.+?)['"];?\s*$""", source, re.MULTILINE)


def _dependency_cruiser_rules() -> dict[str, dict[str, Any]]:
    result = subprocess.run(
        [
            "node",
            "-e",
            "const config = require('./.dependency-cruiser.cjs'); console.log(JSON.stringify(config.forbidden));",
        ],
        check=True,
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    return {rule["name"]: rule for rule in json.loads(result.stdout)}


def test_dependency_cruiser_forbids_feature_to_component_imports() -> None:
    rules = _dependency_cruiser_rules()

    assert rules["features-no-component-dependencies"] == {
        "name": "features-no-component-dependencies",
        "severity": "error",
        "comment": "Feature slices should depend on lower layers, not component orchestration.",
        "from": {"path": "^src/features/"},
        "to": {"path": "^src/components/"},
    }


def test_scheduled_snooze_feature_does_not_import_component_layer() -> None:
    imports = _imports_for("src/features/scheduled-snooze/index.ts")
    assert "../../services/snooze.js" in imports
    assert not any(import_path.startswith("../../components/") for import_path in imports)
