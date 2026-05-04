"""Contract tests for frontend feature-boundary architecture rules."""

from __future__ import annotations

import json
import subprocess
from typing import Any


def _dependency_cruiser_rules() -> dict[str, dict[str, Any]]:
    result = subprocess.run(
        [
            "node",
            "-e",
            "const config = require('./.dependency-cruiser.cjs'); console.log(JSON.stringify(config.forbidden));",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return {rule["name"]: rule for rule in json.loads(result.stdout)}


def test_dependency_cruiser_enforces_feature_isolation() -> None:
    rules = _dependency_cruiser_rules()

    assert rules["no-cross-feature-imports"] == {
        "name": "no-cross-feature-imports",
        "severity": "error",
        "comment": "Feature slices should not depend directly on one another.",
        "from": {"path": "^src/features/"},
        "to": {"path": "^src/features/"},
    }


def test_dependency_cruiser_allows_components_to_depend_on_features() -> None:
    rules = _dependency_cruiser_rules()

    assert rules["components-no-direct-services-or-state"] == {
        "name": "components-no-direct-services-or-state",
        "severity": "error",
        "comment": "Components must depend on feature modules instead of importing service/state runtime layers directly.",
        "from": {"path": "^src/components/"},
        "to": {"path": "^src/(services|state)/"},
    }
