"""Contract tests for Stryker dependency declarations."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
KNIP_CONFIG_PATH = PROJECT_ROOT / "knip.json"
STRYKER_CONFIG_PATH = PROJECT_ROOT / "stryker.config.mjs"


def test_stryker_type_import_has_declared_dev_dependency() -> None:
    """Stryker config type imports must be backed by a direct dev dependency."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text())
    dev_dependencies = package_data.get("devDependencies", {})
    stryker_config = STRYKER_CONFIG_PATH.read_text()

    assert "@stryker-mutator/api/core" in stryker_config, "stryker.config.mjs should keep its typed config import"
    assert "@stryker-mutator/api" in dev_dependencies, (
        "package.json must declare @stryker-mutator/api when stryker.config.mjs imports it"
    )


def test_knip_config_does_not_ignore_stryker_api_dependency() -> None:
    """Knip should not hide the Stryker API dependency once it is declared properly."""
    knip_config = json.loads(KNIP_CONFIG_PATH.read_text())

    ignored = knip_config.get("ignoreDependencies", [])
    assert "@stryker-mutator/api" not in ignored, "knip.json should not ignore @stryker-mutator/api"
