"""Contract tests for frontend resource registration ownership."""

from __future__ import annotations

import ast
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = PROJECT_ROOT / "custom_components" / "autosnooze"
INIT_PATH = BACKEND_ROOT / "__init__.py"
CONST_PATH = BACKEND_ROOT / "const.py"
FRONTEND_ADAPTER_PATH = BACKEND_ROOT / "infrastructure" / "frontend.py"
README_PATH = PROJECT_ROOT / "README.md"


def _defined_functions(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    return {
        node.name
        for node in ast.walk(tree)
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef)
    }


def _imported_names(path: Path, module_name: str) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    imported: set[str] = set()
    for node in ast.walk(tree):
        if not isinstance(node, ast.ImportFrom) or node.module is None:
            continue
        imported_module = "." * node.level + node.module
        if imported_module == module_name:
            imported.update(alias.name for alias in node.names)
    return imported


def test_frontend_resource_registration_lives_in_infrastructure_adapter() -> None:
    """The HA setup root should compose registration, not own frontend resource mechanics."""
    assert FRONTEND_ADAPTER_PATH.exists(), (
        "Frontend resource registration should live in custom_components/autosnooze/"
        "infrastructure/frontend.py."
    )

    root_owned_functions = _defined_functions(INIT_PATH)
    assert "_async_register_static_path" not in root_owned_functions
    assert "_async_register_lovelace_resource" not in root_owned_functions
    assert "_async_retry_or_fail" not in root_owned_functions

    adapter_functions = _defined_functions(FRONTEND_ADAPTER_PATH)
    assert {
        "_async_register_static_path",
        "_async_register_lovelace_resource",
        "_async_retry_or_fail",
    }.issubset(adapter_functions)

    root_imports = _imported_names(INIT_PATH, ".infrastructure.frontend")
    assert {
        "_async_register_static_path",
        "_async_register_lovelace_resource",
    }.issubset(root_imports)


def test_frontend_registration_backcompat_exports_are_declared() -> None:
    """Moved frontend helpers should remain part of the root compatibility surface."""
    init_source = INIT_PATH.read_text(encoding="utf-8")

    for name in [
        "_async_register_static_path",
        "_async_register_lovelace_resource",
        "_async_retry_or_fail",
        "LOVELACE_REGISTER_MAX_RETRIES",
        "LOVELACE_REGISTER_RETRY_DELAY",
    ]:
        assert f'"{name}"' in init_source


def test_frontend_registration_hardening_is_preserved_in_adapter() -> None:
    """The extracted adapter should keep the resource-registration safety behavior."""
    adapter_source = FRONTEND_ADAPTER_PATH.read_text(encoding="utf-8")

    assert "cache_headers=False" in adapter_source
    assert "CARD_URL_VERSIONED" in adapter_source
    assert ".startswith(CARD_URL)" in adapter_source
    assert "_async_retry_or_fail" in adapter_source
    assert "async_delete_item" not in adapter_source
    assert '{"url": CARD_URL_VERSIONED, "res_type": "module"}' in adapter_source


def test_lovelace_resource_uses_integration_served_versioned_url() -> None:
    """Integration-served resources should not assume a HACS dashboard-card install path."""
    const_source = CONST_PATH.read_text(encoding="utf-8")
    adapter_source = FRONTEND_ADAPTER_PATH.read_text(encoding="utf-8")

    assert 'CARD_URL = "/autosnooze-card.js"' in const_source
    assert 'CARD_URL_VERSIONED = f"/autosnooze-card.js?v={VERSION}"' in const_source
    assert "hacsfiles" not in const_source
    assert "hacstag" not in const_source
    assert "CARD_URL_VERSIONED" in adapter_source
    assert "CARD_HACS_URL" not in adapter_source


def test_existing_python_contract_surface_stays_compatible() -> None:
    """Frontend hardening should be tested at the adapter, not copied into the root."""
    adapter_source = FRONTEND_ADAPTER_PATH.read_text(encoding="utf-8")

    assert "StaticPathConfig" in adapter_source
    assert "cache_headers=False" in adapter_source
    assert "for url in (CARD_URL, CARD_HACS_URL)" not in adapter_source
    assert "[StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=False)]" in adapter_source


def test_root_does_not_keep_frontend_compatibility_shims() -> None:
    """The setup root should not duplicate adapter strings just to satisfy source tests."""
    init_source = INIT_PATH.read_text(encoding="utf-8")

    assert "_FRONTEND_" not in init_source
    assert "from homeassistant.components.http import StaticPathConfig" not in init_source
    assert '{"url": CARD_URL_VERSIONED, "res_type": "module"}' not in init_source


def test_readme_uses_integration_served_resource_url() -> None:
    """Manual resource docs should point at the integration-served module URL."""
    readme_source = README_PATH.read_text(encoding="utf-8")

    assert "/autosnooze-card.js" in readme_source
    assert "hacsfiles" not in readme_source
    assert "hacstag" not in readme_source
