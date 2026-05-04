"""Contract tests for backend slice import direction."""

from __future__ import annotations

import ast
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = PROJECT_ROOT / "custom_components" / "autosnooze"
ARCHITECTURE_PATH = PROJECT_ROOT / "architecture.md"


def _import_modules(path: Path) -> list[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    modules: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module:
            modules.append("." * node.level + node.module)
        elif isinstance(node, ast.Import):
            modules.extend(alias.name for alias in node.names)
    return modules


def test_application_slice_does_not_import_service_registration_layer() -> None:
    """Application flows should not call back upward into service registration."""
    offenders: list[str] = []
    for path in sorted((BACKEND_ROOT / "application").glob("*.py")):
        imports = _import_modules(path)
        if any(module in {"..services", "custom_components.autosnooze.services"} for module in imports):
            offenders.append(str(path.relative_to(PROJECT_ROOT)))

    assert offenders == [], (
        "Application modules must not import services.py; move orchestration dependencies downward. "
        f"Offenders: {offenders}"
    )


def test_service_registration_layer_does_not_import_private_application_helpers() -> None:
    """services.py should depend on public application handlers, not private workflow internals."""
    services_path = BACKEND_ROOT / "services.py"
    tree = ast.parse(services_path.read_text(encoding="utf-8"))
    private_imports: list[str] = []

    for node in ast.walk(tree):
        if not isinstance(node, ast.ImportFrom) or node.module is None:
            continue
        module_name = "." * node.level + node.module
        if module_name.startswith(".application") or module_name.startswith("custom_components.autosnooze.application"):
            private_imports.extend(alias.name for alias in node.names if alias.name.startswith("_"))

    assert private_imports == [], (
        "services.py must not import private application helpers; expose public application handlers instead. "
        f"Private imports: {private_imports}"
    )


def test_service_registration_layer_does_not_own_pause_by_filter_workflow() -> None:
    """Area/label pause orchestration belongs in the application layer, not the HA registration adapter."""
    services_path = BACKEND_ROOT / "services.py"
    tree = ast.parse(services_path.read_text(encoding="utf-8"))

    forbidden_defs = {
        "_get_automations_by_filter",
        "get_automations_by_area",
        "get_automations_by_label",
        "_handle_pause_by_filter",
    }
    defined = {
        node.name
        for node in ast.walk(tree)
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef)
    }

    assert defined.isdisjoint(forbidden_defs), (
        "services.py should register handlers and delegate pause-by-area/label workflows to application code. "
        f"Workflow functions still defined in services.py: {sorted(defined & forbidden_defs)}"
    )


def test_application_and_runtime_slices_do_not_import_coordinator_facade() -> None:
    """Application/runtime modules should not call back upward into coordinator.py."""
    offenders: list[str] = []
    for root_name in ["application", "runtime"]:
        for path in sorted((BACKEND_ROOT / root_name).glob("*.py")):
            imports = _import_modules(path)
            if any(module in {"..coordinator", "custom_components.autosnooze.coordinator"} for module in imports):
                offenders.append(str(path.relative_to(PROJECT_ROOT)))

    assert offenders == [], (
        "Application/runtime modules must not import coordinator.py; keep orchestration in slices and lower helpers. "
        f"Offenders: {offenders}"
    )


def test_runtime_slice_does_not_import_application_workflows() -> None:
    """Runtime helpers should receive workflow callbacks from higher layers."""
    offenders: list[str] = []
    for path in sorted((BACKEND_ROOT / "runtime").glob("*.py")):
        imports = _import_modules(path)
        if any(
            module.startswith("..application")
            or module.startswith("custom_components.autosnooze.application")
            for module in imports
        ):
            offenders.append(str(path.relative_to(PROJECT_ROOT)))

    assert offenders == [], (
        "Runtime modules must not import application workflows; inject callbacks from the application layer. "
        f"Offenders: {offenders}"
    )


def test_models_module_does_not_import_runtime_state_container() -> None:
    """Serializable models should not depend upward on the runtime state layer."""
    imports = _import_modules(BACKEND_ROOT / "models.py")
    offenders = [
        module
        for module in imports
        if module.startswith(".runtime") or module.startswith("custom_components.autosnooze.runtime")
    ]

    assert offenders == [], (
        "models.py should stay low-level and must not import runtime state containers. "
        f"Runtime imports: {offenders}"
    )


def test_runtime_state_does_not_reach_back_into_models_module() -> None:
    """Runtime state should not dynamically import models to make monkeypatch seams work."""
    state_source = (BACKEND_ROOT / "runtime" / "state.py").read_text(encoding="utf-8")

    assert "importlib.import_module" not in state_source
    assert "custom_components.autosnooze.models" not in state_source


def test_architecture_document_exists_and_names_enforced_boundaries() -> None:
    """Boundary contracts should have a durable source-of-truth document."""
    assert ARCHITECTURE_PATH.exists(), "architecture.md must document the slice architecture"

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8").lower()
    required_terms = [
        "modular monolith",
        "slice",
        "components",
        "features",
        "services",
        "state",
        "application",
    ]
    missing = [term for term in required_terms if term not in architecture]

    assert missing == [], f"architecture.md is missing enforced boundary terms: {missing}"
